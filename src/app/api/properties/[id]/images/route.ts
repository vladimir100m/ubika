import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../pages/api/auth/[...nextauth]';
import { query } from '../../../../../lib/db';
import { createRequestId, createLogger } from '../../../../../lib/logger';
import { cacheInvalidatePattern } from '../../../../../lib/cache';
import { CACHE_KEYS } from '../../../../../lib/cacheKeyBuilder';

interface BatchImageData {
  image_url: string;
  is_cover?: boolean;
  display_order?: number;
  file_size?: number;
  mime_type?: string;
  original_filename?: string;
  blob_path?: string;
  alt_text?: string;
}

export async function POST(req: NextRequest) {
  const reqId = createRequestId('batch-img-');
  const log = createLogger(reqId);
  log.info('Batch image upload handler start');

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      log.warn('Unauthorized batch image upload attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).sub || session.user.email;
    const body = await req.json();
    const { property_id, images }: { property_id: string | number; images: BatchImageData[] } = body;

    log.info('Batch image upload request', { property_id, imageCount: images?.length });

    if (!property_id || !images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: property_id and images array' },
        { status: 400 }
      );
    }

    if (images.length > 15) { // Reasonable limit
      return NextResponse.json(
        { error: 'Too many images. Maximum 15 images per batch.' },
        { status: 400 }
      );
    }

    // Verify property ownership
    const propertyCheck = await query(
      'SELECT id, seller_id FROM properties WHERE id = $1',
      [property_id]
    );

    if (propertyCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const property = propertyCheck.rows[0];
    const isOwner = property.seller_id === userId || !property.seller_id;
    
    if (!isOwner) {
      return NextResponse.json({ 
        error: 'You can only add images to your own properties' 
      }, { status: 403 });
    }

    // Start transaction for atomic operation
    const client = await query('BEGIN');
    
    try {
      // Unset existing cover if any new image is marked as cover
      const hasCover = images.some(img => img.is_cover);
      if (hasCover) {
        await query(
          'UPDATE property_images SET is_cover = false, updated_at = NOW() WHERE property_id = $1 AND is_cover = true',
          [property_id]
        );
      }

      // Get next available display order
      const maxOrderResult = await query(
        'SELECT COALESCE(MAX(display_order), -1) as max_order FROM property_images WHERE property_id = $1',
        [property_id]
      );
      let nextOrder = (maxOrderResult.rows[0]?.max_order || -1) + 1;

      // Insert all images
      const insertedImages: any[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const displayOrder = img.display_order !== undefined ? img.display_order : nextOrder++;
        
        const insertQuery = `
          INSERT INTO property_images (
            property_id, image_url, is_cover, display_order,
            file_size, mime_type, original_filename, blob_path, alt_text,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING id, property_id, image_url, is_cover, display_order,
                    file_size, mime_type, original_filename, blob_path, alt_text,
                    created_at, updated_at
        `;

        const values = [
          property_id,
          img.image_url,
          img.is_cover || false,
          displayOrder,
          img.file_size || null,
          img.mime_type || null,
          img.original_filename || null,
          img.blob_path || null,
          img.alt_text || null,
        ];

        const result = await query(insertQuery, values);
        if (result.rows.length > 0) {
          insertedImages.push(result.rows[0]);
        }
      }

      // Commit transaction
      await query('COMMIT');

      log.info('Batch images inserted successfully', { 
        property_id, 
        insertedCount: insertedImages.length 
      });

      // Comprehensive cache invalidation after batch image upload
      try {
        // Individual property cache
        await cacheInvalidatePattern(CACHE_KEYS.property(String(property_id)) + '*');
        
        // All properties lists (including filtered lists)
        await cacheInvalidatePattern(CACHE_KEYS.properties.listPattern());
        await cacheInvalidatePattern('v1:properties:*');
        
        // Seller-specific patterns
        await cacheInvalidatePattern(CACHE_KEYS.seller(property.seller_id).listPattern());
        await cacheInvalidatePattern(`v1:seller:${property.seller_id}:*`);
        
        // Base keys without filters
        await cacheInvalidatePattern('v1:properties:list');
        
        log.info('Comprehensive cache invalidated after batch image upload', { 
          propertyId: property_id, 
          sellerId: property.seller_id,
          imageCount: insertedImages.length
        });
      } catch (e) {
        log.warn('Cache invalidation failed', { error: e });
      }

      const response = NextResponse.json({
        success: true,
        property_id,
        images: insertedImages,
        inserted_count: insertedImages.length
      });
      response.headers.set('X-Cache-Invalidated', 'true');
      response.headers.set('X-Property-Updated', property_id.toString());
      return response;

    } catch (error) {
      // Rollback transaction
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    log.error('Error in batch image upload', { error });
    return NextResponse.json(
      { error: 'Failed to upload images', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all images for a property
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const reqId = createRequestId('get-imgs-');
  const log = createLogger(reqId);
  
  try {
    const propertyId = params.id;
    
    const result = await query(
      `SELECT id, property_id, image_url, is_cover, display_order,
              file_size, mime_type, original_filename, blob_path, alt_text,
              created_at, updated_at
       FROM property_images 
       WHERE property_id = $1 
       ORDER BY is_cover DESC, display_order ASC`,
      [propertyId]
    );

    log.info('Fetched property images', { propertyId, count: result.rows.length });

    return NextResponse.json(result.rows);
    
  } catch (error) {
    log.error('Error fetching property images', { error });
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}