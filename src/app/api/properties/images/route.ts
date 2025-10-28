import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../pages/api/auth/[...nextauth]';
import { query } from '../../../../lib/db';
import { createRequestId, createLogger } from '../../../../lib/logger';
import { cacheInvalidatePattern } from '../../../../lib/cache';
import { getAffectedCachePatterns } from '../../../../lib/cacheOptimization';
import { CACHE_KEYS } from '../../../../lib/cacheKeyBuilder';

export async function POST(req: NextRequest) {
  const reqId = createRequestId('req-');
  const log = createLogger(reqId);
  log.info('Register property image handler start');

  try {
    // Get session to verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      log.warn('Unauthorized image registration attempt - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).sub || session.user.email;
    log.info('Session user authenticated', { userId, hasSubId: !!(session.user as any).sub });

    const body = await req.json();
    const { 
      property_id, 
      image_url, 
      is_cover, 
      display_order, 
      file_size, 
      mime_type, 
      original_filename, 
      blob_path, 
      alt_text 
    } = body;
    
    log.info('Image registration request', { 
      property_id, 
      image_url, 
      is_cover, 
      display_order, 
      file_size, 
      mime_type, 
      original_filename 
    });

    if (!property_id || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields: property_id and image_url' },
        { status: 400 }
      );
    }

    // If this is meant to be a cover image, unset any existing cover for this property
    if (is_cover) {
      log.info('Unsetting existing cover image for property', { property_id });
      await query(
        'UPDATE property_images SET is_cover = false, updated_at = NOW() WHERE property_id = $1 AND is_cover = true',
        [property_id]
      );
    }

    // Auto-assign display order if not provided
    let finalDisplayOrder = display_order;
    if (finalDisplayOrder === undefined || finalDisplayOrder === null) {
      const maxOrderResult = await query(
        'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM property_images WHERE property_id = $1',
        [property_id]
      );
      finalDisplayOrder = maxOrderResult.rows[0]?.next_order || 0;
      log.info('Auto-assigned display order', { property_id, display_order: finalDisplayOrder });
    }

    // Verify property belongs to user
    const propertyCheck = await query(
      `SELECT id, seller_id, city, operation_status_id, price, bedrooms as rooms
       FROM properties WHERE id = $1`,
      [property_id]
    );

    if (propertyCheck.rows.length === 0) {
      log.warn('Property not found', { property_id });
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const property = propertyCheck.rows[0];
    log.info('Property found', { property_id, seller_id: property.seller_id, userId });
    
    // Allow either exact match OR if property has no seller assigned (admin override)
    const isOwner = property.seller_id === userId || !property.seller_id;
    if (!isOwner) {
      log.warn('Unauthorized image registration - user does not own property', { userId, propertyId: property_id, owner: property.seller_id });
      return NextResponse.json({ error: 'You can only add images to your own properties', details: { userId, owner: property.seller_id } }, { status: 403 });
    }
    
    log.info('Property ownership verified', { property_id, userId });

    // Insert image record in database with enhanced metadata
    const insertQuery = `
      INSERT INTO property_images (
        property_id, image_url, is_cover, display_order, 
        file_size, mime_type, original_filename, alt_text,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, property_id, image_url, is_cover, display_order, 
                file_size, mime_type, original_filename, alt_text,
                created_at, updated_at
    `;

    const values = [
      property_id,
      image_url,
      is_cover || false,
      finalDisplayOrder,
      file_size || null,
      mime_type || null,
      original_filename || null,
      alt_text || null,
    ];

    log.info('Executing database insert', { query: insertQuery, values });
    const result = await query(insertQuery, values);
    
    if (!result.rows || result.rows.length === 0) {
      log.error('Database insert failed - no rows returned', { query: insertQuery, values });
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
    }

    const image = result.rows[0];
    log.info('Image successfully inserted into database', {
      id: image.id,
      property_id: image.property_id,
      image_url: image.image_url,
    });

    // Invalidate property cache when image is added - comprehensive invalidation
    try {
      const cacheKey = CACHE_KEYS.property(property_id);
      
      // Individual property cache
      await cacheInvalidatePattern(`${cacheKey}*`);
      
      // All properties lists (including filtered lists)
      await cacheInvalidatePattern(CACHE_KEYS.properties.listPattern());
      await cacheInvalidatePattern('v1:properties:*');
      
      // Seller-specific patterns
      await cacheInvalidatePattern(CACHE_KEYS.seller(property.seller_id).listPattern());
      await cacheInvalidatePattern(`v1:seller:${property.seller_id}:*`);
      
      // Also invalidate any potential base keys without filters
      await cacheInvalidatePattern('v1:properties:list');
      
      // Targeted invalidation based on property attributes
      try {
        const affected = getAffectedCachePatterns(property);
        for (const p of affected) {
          await cacheInvalidatePattern(p);
        }
      } catch (ia) {
        log.warn('Targeted invalidation failed', { error: ia });
      }

      log.info('Cache invalidated after image registration', { 
        propertyId: property_id, 
        sellerId: property.seller_id,
        patterns: ['property', 'properties:list', 'seller:list', 'targeted']
      });
    } catch (e) {
      log.warn('Failed to invalidate cache after image registration', { error: e });
    }

    log.info('Property image registered', {
      id: image.id,
      property_id: image.property_id,
      is_cover: image.is_cover,
    });

    const response = NextResponse.json(image);
    response.headers.set('X-Cache-Invalidated', 'true');
    response.headers.set('X-Property-Updated', property_id.toString());
    return response;
  } catch (error) {
    log.error('Error registering property image', { error });
    return NextResponse.json(
      { error: 'Failed to register image' },
      { status: 500 }
    );
  }
}
