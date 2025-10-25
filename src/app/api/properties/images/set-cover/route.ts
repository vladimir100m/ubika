import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../pages/api/auth/[...nextauth]';
import { query } from '../../../../../lib/db';
import { createRequestId, createLogger } from '../../../../../lib/logger';
import { cacheInvalidatePattern } from '../../../../../lib/cache';
import { getAffectedCachePatterns } from '../../../../../lib/cacheOptimization';
import { CACHE_KEYS } from '../../../../../lib/cacheKeyBuilder';

export async function POST(req: NextRequest) {
  const reqId = createRequestId('req-');
  const log = createLogger(reqId);
  log.info('set cover image handler start', { method: req.method, url: req.url });

  try {
    // Get session to verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      log.warn('Unauthorized set cover attempt - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).sub || session.user.email;

    const body = await req.json();
    const { imageId, propertyId } = body;

    if (!imageId || !propertyId) {
      return NextResponse.json({ error: 'Missing imageId or propertyId' }, { status: 400 });
    }

    // Verify property belongs to user
    const propertyCheck = await query(
      `SELECT id, seller_id, city, operation_status_id, price, room as rooms
       FROM properties WHERE id = $1`,
      [propertyId]
    );

    if (propertyCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const property = propertyCheck.rows[0];
    if (property.seller_id !== userId) {
      log.warn('Unauthorized set cover attempt - user does not own property', { userId, propertyId, owner: property.seller_id });
      return NextResponse.json({ error: 'You can only edit your own properties' }, { status: 403 });
    }

    // Verify the image exists and belongs to this property
    const checkQuery = 'SELECT id, property_id FROM property_images WHERE id = $1 AND property_id = $2';
    const checkResult = await query(checkQuery, [imageId, propertyId]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Image not found or does not belong to this property' }, { status: 404 });
    }

    // Update: Set all images for this property to is_cover = false
    await query('UPDATE property_images SET is_cover = false WHERE property_id = $1', [propertyId]);
    
    // Then: Set the selected image to is_cover = true
    await query('UPDATE property_images SET is_cover = true WHERE id = $1', [imageId]);

    // Invalidate property cache when cover image is changed
    try {
      const cacheKey = CACHE_KEYS.property(propertyId);
      // Invalidate global listings and seller-specific listings
      await cacheInvalidatePattern(`${cacheKey}*`);
      await cacheInvalidatePattern(CACHE_KEYS.properties.listPattern());
      await cacheInvalidatePattern(CACHE_KEYS.seller(property.seller_id).listPattern());

      // Targeted invalidation based on property attributes
      try {
        const affected = getAffectedCachePatterns(property);
        for (const p of affected) {
          await cacheInvalidatePattern(p);
        }
      } catch (ia) {
        log.warn('Targeted invalidation failed', { error: ia });
      }

      log.info('Cache invalidated after cover image change', { propertyId, imageId, sellerId: property.seller_id });
    } catch (e) {
      log.warn('Failed to invalidate cache after cover image change', { error: e });
    }

    log.info('Cover image set successfully', { imageId, propertyId });
    const response = NextResponse.json({ success: true, imageId, propertyId });
    response.headers.set('X-Cache-Invalidated', 'true');
    return response;
  } catch (error) {
    log.error('Error setting cover image', error);
    return NextResponse.json({ error: 'Failed to set cover image' }, { status: 500 });
  }
}
