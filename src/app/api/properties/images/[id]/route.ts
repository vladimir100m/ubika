import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../pages/api/auth/[...nextauth]';
import { query } from '../../../../../lib/db';
import { createRequestId, createLogger } from '../../../../../lib/logger';
import { cacheInvalidatePattern } from '../../../../../lib/cache';
import { getAffectedCachePatterns } from '../../../../../lib/cacheOptimization';
import { CACHE_KEYS } from '../../../../../lib/cacheKeyBuilder';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reqId = createRequestId('req-');
  const log = createLogger(reqId);
  const imageId = params.id;

  log.info('delete property image handler start', { imageId });

  try {
    // Get session to verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      log.warn('Unauthorized image deletion attempt - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).sub || session.user.email;

    // Get the image and property to verify ownership
    const getImageQuery = `
      SELECT pi.id, pi.image_url, pi.property_id, p.seller_id, p.city, p.operation_status_id, p.price, p.room as rooms
      FROM property_images pi
      JOIN properties p ON pi.property_id = p.id
      WHERE pi.id = $1
    `;
    const getImageResult = await query(getImageQuery, [imageId]);

    if (getImageResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    const image = getImageResult.rows[0];
    
    // Verify ownership
    if (image.seller_id !== userId) {
      log.warn('Unauthorized image deletion - user does not own property', { userId, imageId, owner: image.seller_id });
      return NextResponse.json({ error: 'You can only delete images from your own properties' }, { status: 403 });
    }

    log.info('Found image to delete', { imageId, imageUrl: image.image_url });

    // Delete the image record from database
    const deleteImageQuery = `
      DELETE FROM property_images WHERE id = $1
      RETURNING id, property_id
    `;
    const result = await query(deleteImageQuery, [imageId]);
    const propertyId = result.rows[0]?.property_id;

    // Invalidate property cache when image is deleted
    try {
      if (propertyId) {
        const cacheKey = CACHE_KEYS.property(propertyId);
        // Invalidate global listings and seller-specific listings
        await cacheInvalidatePattern(`${cacheKey}*`);
        await cacheInvalidatePattern(CACHE_KEYS.properties.listPattern());
        await cacheInvalidatePattern(CACHE_KEYS.seller(image.seller_id).listPattern());

        // Targeted invalidation based on property attributes
        try {
          const affected = getAffectedCachePatterns(image);
          for (const p of affected) {
            await cacheInvalidatePattern(p);
          }
        } catch (ia) {
          log.warn('Targeted invalidation failed', { error: ia });
        }

        log.info('Cache invalidated after image deletion', { propertyId, imageId, sellerId: image.seller_id });
      }
    } catch (e) {
      log.warn('Failed to invalidate cache after image deletion', { error: e });
    }

    log.info('Property image deleted successfully', { imageId });

    const response = NextResponse.json({ success: true, id: imageId });
    response.headers.set('X-Cache-Invalidated', 'true');
    return response;
  } catch (error) {
    log.error('Error deleting property image', { error });
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
