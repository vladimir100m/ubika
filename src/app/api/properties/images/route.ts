import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../pages/api/auth/[...nextauth]';
import { query } from '../../../../lib/db';
import { createRequestId, createLogger } from '../../../../lib/logger';
import { cacheDel, cacheInvalidatePattern } from '../../../../lib/cache';

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

    const body = await req.json();
    const { property_id, image_url, is_cover, display_order } = body;

    if (!property_id || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields: property_id and image_url' },
        { status: 400 }
      );
    }

    // Verify property belongs to user
    const propertyCheck = await query(
      'SELECT id, seller_id FROM properties WHERE id = $1',
      [property_id]
    );

    if (propertyCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const property = propertyCheck.rows[0];
    if (property.seller_id !== userId) {
      log.warn('Unauthorized image registration - user does not own property', { userId, propertyId: property_id, owner: property.seller_id });
      return NextResponse.json({ error: 'You can only add images to your own properties' }, { status: 403 });
    }

    // Insert image record in database
    const insertQuery = `
      INSERT INTO property_images (property_id, image_url, is_cover, display_order, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, property_id, image_url, is_cover, display_order, created_at
    `;

    const result = await query(insertQuery, [
      property_id,
      image_url,
      is_cover || false,
      display_order || 0,
    ]);

    const image = result.rows[0];

    // Invalidate property cache when image is added
    try {
      const cacheKey = `property:${property_id}`;
      await cacheDel(cacheKey);
      await cacheInvalidatePattern(`properties:list:*`);
      log.info('Cache invalidated after image registration', { propertyId: property_id });
    } catch (e) {
      log.warn('Failed to invalidate cache after image registration', { error: e });
    }

    log.info('Property image registered', {
      id: image.id,
      property_id: image.property_id,
      is_cover: image.is_cover,
    });

    return NextResponse.json(image);
  } catch (error) {
    log.error('Error registering property image', { error });
    return NextResponse.json(
      { error: 'Failed to register image' },
      { status: 500 }
    );
  }
}
