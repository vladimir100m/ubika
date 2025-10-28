import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../pages/api/auth/[...nextauth]';
import { query } from '../../../../lib/db';
import { resolveImageUrl } from '../../../../lib/blob';
import { Property } from '../../../../types';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../../../../lib/cache';
import { getAffectedCachePatterns } from '../../../../lib/cacheOptimization';
import { createRequestId, createLogger } from '../../../../lib/logger';
import { CACHE_KEYS } from '../../../../lib/cacheKeyBuilder';
import { cacheMetrics } from '../../../../lib/cacheMetrics';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const reqId = createRequestId('req-');
  const log = createLogger(reqId);
  log.info('property detail handler start', { method: req.method, url: req.url });

  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
  }

  try {
    const defaultTtl = parseInt(process.env.PROPERTY_DETAIL_CACHE_TTL || '120', 10);
    const cacheKey = `property:${id}`;
    try {
      const cached = await cacheGet<Property>(cacheKey);
      if (cached) {
        log.info('Cache hit', { cacheKey });
        const response = NextResponse.json(cached);
        response.headers.set('Cache-Control', `private, max-age=${defaultTtl}`);
        return response;
      }
      log.debug('Cache miss', { cacheKey });
    } catch (e) {
      log.warn('Cache get failed, continuing to DB', e);
    }
    
    const propertyQuery = `
      SELECT 
        p.id, p.title, p.description, p.price, p.address, p.city, p.state, p.country, 
        p.zip_code, pt.name as property_type, p.bedrooms as rooms, p.bathrooms, p.square_meters as "squareMeters",
        NULL as image_url,
        ps.name as property_status, p.created_at, p.updated_at, p.year_built as yearBuilt, 
        p.geocode, p.seller_id, p.operation_status_id,
        pos.name as operation_status, pos.display_name as operation_status_display
      FROM properties p
      LEFT JOIN property_operation_statuses pos ON p.operation_status_id = pos.id
      LEFT JOIN property_types pt ON p.property_type_id = pt.id
      LEFT JOIN property_statuses ps ON p.property_status_id = ps.id
      WHERE p.id = $1
    `;

    const qStart = Date.now();
    const result = await query(propertyQuery, [id]);
    log.info('DB query executed', { durationMs: Date.now() - qStart });
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const property = result.rows[0];

    try {
      const imgLog = createLogger(`${reqId}-img-${property.id}`);
      imgLog.debug('Fetching images for property');
      const imagesResult = await query(
        'SELECT id, property_id, image_url, is_cover, display_order, created_at, updated_at FROM property_images WHERE property_id = $1 ORDER BY is_cover DESC, display_order ASC',
        [property.id]
      );
      const imgs = imagesResult.rows;
      for (const img of imgs) {
        try {
          const before = img.image_url;
          img.image_url = await resolveImageUrl(img.image_url);
          imgLog.debug('Resolved image url', { before, after: img.image_url });
        } catch (e) {
          imgLog.warn('resolveImageUrl failed, leaving original', e);
        }
      }
      property.images = imgs;
      log.debug('Images fetched', { count: imgs.length });
    } catch (imageError) {
      log.error('Failed to fetch images for property', { propertyId: property.id, error: imageError });
      property.images = [];
    }

    try {
      await cacheSet(cacheKey, property, defaultTtl);
      log.debug('Cache set', { cacheKey, ttl: defaultTtl });
    } catch (e) {
      log.warn('Cache set failed', e);
    }

    log.info('property detail handler finished', { propertyId: property.id });
    const response = NextResponse.json(property);
    response.headers.set('Cache-Control', `private, max-age=${defaultTtl}`);
    return response;
  } catch (error) {
    log.error('Error fetching property', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const reqId = createRequestId('req-');
  const log = createLogger(reqId);
  log.info('property update handler start', { method: req.method, url: req.url });

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
  }

  try {
    // Get session to verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      log.warn('Unauthorized update attempt - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).sub || session.user.email;
    log.info('Verifying ownership for user', { userId, propertyId: id });

    // Verify property exists and belongs to the user
    const ownershipCheck = await query(
      'SELECT seller_id FROM properties WHERE id = $1',
      [id]
    );

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const propertyOwner = ownershipCheck.rows[0];
    if (propertyOwner.seller_id !== userId) {
      log.warn('Unauthorized update attempt - user does not own property', { userId, propertyId: id, owner: propertyOwner.seller_id });
      return NextResponse.json({ error: 'You can only edit your own properties' }, { status: 403 });
    }

    log.info('Ownership verified, proceeding with update', { propertyId: id });

    const body = await req.json();
    log.info('Update request body received', { keys: Object.keys(body) });

    // Fields that map directly to DB columns (after normalization)
    const directFields = ['title', 'description', 'price', 'address', 'city', 'state', 'country', 
                         'zip_code', 'bathrooms', 'square_meters', 'lat', 'lng', 'operation_status_id', 
                         'property_type_id', 'property_status_id', 'seller_id', 'bedrooms', 'year_built', 'geocode'];

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(body)) {
      if (value === undefined || value === null) {
        log.debug('Skipping null/undefined field', { key });
        continue;
      }

      let dbColumn = key;
      let dbValue = value;

      // Handle legacy field name mappings
      if (key === 'room') {
        dbColumn = 'bedrooms';
        dbValue = value;
      } else if (key === 'sq_meters' || key === 'square_meters') {
        dbColumn = 'square_meters';
        dbValue = value;
      } else if (key === 'year_built' || key === 'yearbuilt') {
        dbColumn = 'year_built';
        dbValue = value;
      }
      // Skip legacy type and status if provided without IDs (would need lookup)
      // These should be provided as property_type_id and property_status_id instead
      else if (key === 'type' || key === 'status') {
        log.warn('Legacy field provided without ID lookup - skipping', { key, value });
        continue;
      }
      // Skip features - handled separately
      else if (key === 'features') {
        log.debug('Skipping features field - will be handled separately');
        continue;
      }

      if (directFields.includes(dbColumn)) {
        fields.push(`${dbColumn} = $${idx}`);
        values.push(dbValue);
        idx++;
        log.debug('Added field to update', { dbColumn, idx: idx - 1 });
      } else {
        log.warn('Field not in allowed list', { key, dbColumn });
      }
    }

    if (fields.length > 0) {
      const updateQuery = `UPDATE properties SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING id`;
      values.push(id);
      log.info('Executing update query', { fields: fields.length, query: updateQuery.substring(0, 100), valueCount: values.length });
      try {
        await query(updateQuery, values);
        log.info('Update query executed successfully', { propertyId: id });
      } catch (updateError) {
        log.error('Update query failed', { error: updateError, query: updateQuery, values });
        throw updateError;
      }
    } else {
      log.warn('No fields to update', { propertyId: id });
    }

    // Handle features update (optional)
    if (Array.isArray(body.features)) {
      log.info('Updating features', { count: body.features.length });
      // Delete existing
      await query('DELETE FROM property_feature_assignments WHERE property_id = $1', [id]);
      // Insert new
      for (const f of body.features) {
        await query('INSERT INTO property_feature_assignments(property_id, feature_id) VALUES($1, $2)', [id, f]);
      }
      log.info('Features updated successfully');
    }

    // Return the updated property using same logic as GET (call DB)
    const propertyQuery = `
      SELECT 
        p.id, p.title, p.description, p.price, p.address, p.city, p.state, p.country, 
        p.zip_code, pt.name as property_type, p.bedrooms as rooms, p.bathrooms, p.square_meters as "squareMeters",
        NULL as image_url,
        ps.name as property_status, p.created_at, p.updated_at, p.year_built as yearBuilt, 
        p.geocode, p.seller_id, p.operation_status_id,
        pos.name as operation_status, pos.display_name as operation_status_display
      FROM properties p
      LEFT JOIN property_types pt ON p.property_type_id = pt.id
      LEFT JOIN property_statuses ps ON p.property_status_id = ps.id
      LEFT JOIN property_operation_statuses pos ON p.operation_status_id = pos.id
      WHERE p.id = $1
    `;
    const result = await query(propertyQuery, [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found after update' }, { status: 404 });
    }
    const property = result.rows[0];

    try {
      const imagesResult = await query(
        'SELECT id, property_id, image_url, is_cover, display_order, created_at, updated_at FROM property_images WHERE property_id = $1 ORDER BY is_cover DESC, display_order ASC',
        [property.id]
      );
      property.images = imagesResult.rows || [];
    } catch (e) {
      property.images = [];
    }

    // Fetch features
    try {
      const feats = await query('SELECT f.id, f.name FROM property_features f JOIN property_feature_assignments a ON a.feature_id = f.id WHERE a.property_id = $1', [id]);
      property.features = feats.rows || [];
    } catch (e) {
      property.features = [];
    }

    // Invalidate caches after successful update
    try {
      const cacheKey = CACHE_KEYS.property(id);
      // Use pattern invalidation only for simplicity and reliability
      await cacheInvalidatePattern(`${cacheKey}*`);
      await cacheInvalidatePattern(CACHE_KEYS.properties.listPattern());
      await cacheInvalidatePattern(CACHE_KEYS.seller(userId).listPattern());
      
      // Targeted invalidation based on property attributes
      try {
        const affected = getAffectedCachePatterns(property);
        for (const p of affected) {
          await cacheInvalidatePattern(p);
        }
      } catch (ia) {
        log.warn('Targeted invalidation failed', { error: ia });
      }

      log.info('Cache invalidated after property update', { propertyId: id, userId });
    } catch (e) {
      log.warn('Failed to invalidate cache after update', { error: e });
      // Don't fail the update if cache invalidation fails
    }

    log.info('property update handler finished', { propertyId: id });
    return NextResponse.json(property);
  } catch (error) {
    log.error('Error updating property', { error, message: error instanceof Error ? error.message : 'Unknown error' });
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage, details: 'Failed to update property' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const reqId = createRequestId('req-');
  const log = createLogger(reqId);
  log.info('property delete handler start', { propertyId: params.id });

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
  }

  try {
    // Get session to verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      log.warn('Unauthorized delete attempt - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).sub || session.user.email;
    log.info('Verifying ownership for user', { userId, propertyId: id });

    // First, verify property exists and belongs to the user
    const checkQuery = `SELECT id, seller_id, city, operation_status_id, price, bedrooms as rooms FROM properties WHERE id = $1`;
    const checkResult = await query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const propertyData = checkResult.rows[0];
    if (propertyData.seller_id !== userId) {
      log.warn('Unauthorized delete attempt - user does not own property', { userId, propertyId: id, owner: propertyData.seller_id });
      return NextResponse.json({ error: 'You can only delete your own properties' }, { status: 403 });
    }

    log.info('Ownership verified, proceeding with delete', { propertyId: id });

    // Get the property images to log deletion (blob deletion handled separately if needed)
    const getImagesQuery = 'SELECT image_url FROM property_images WHERE property_id = $1';
    const imagesResult = await query(getImagesQuery, [id]);
    const imageCount = imagesResult.rows.length;
    log.info('Found images to delete', { count: imageCount });

    // Delete property images from database
    const deleteImagesQuery = 'DELETE FROM property_images WHERE property_id = $1';
    await query(deleteImagesQuery, [id]);
    log.info('Deleted property images from database', { count: imageCount });

    // Delete property itself
    const deletePropertyQuery = 'DELETE FROM properties WHERE id = $1 RETURNING id';
    const result = await query(deletePropertyQuery, [id]);

    // Invalidate caches after successful deletion
    try {
      const cacheKey = CACHE_KEYS.property(id);
      // Use pattern invalidation only (more reliable, single call)
      await cacheInvalidatePattern(`${cacheKey}*`);
      await cacheInvalidatePattern(CACHE_KEYS.properties.listPattern());
      await cacheInvalidatePattern(CACHE_KEYS.seller(propertyData.seller_id).listPattern());

      // Targeted invalidation based on property attributes (zone/op/price/rooms)
      try {
        const affected = getAffectedCachePatterns(propertyData);
        for (const p of affected) {
          await cacheInvalidatePattern(p);
        }
      } catch (ia) {
        log.warn('Targeted invalidation failed', { error: ia });
      }

      log.info('Cache invalidated after property deletion', { propertyId: id, userId });
    } catch (e) {
      log.warn('Failed to invalidate cache after deletion', { error: e });
      // Don't fail the deletion if cache invalidation fails
    }

    log.info('Property deleted successfully', { propertyId: id });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    log.error('Error deleting property', error);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
}
