import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { resolveImageUrl } from '../../../../lib/blob';
import { Property } from '../../../../types';
import { cacheGet, cacheSet } from '../../../../lib/cache';
import { createRequestId, createLogger } from '../../../../lib/logger';

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
        return NextResponse.json(cached);
      }
      log.debug('Cache miss', { cacheKey });
    } catch (e) {
      log.warn('Cache get failed, continuing to DB', e);
    }
    
    const propertyQuery = `
      SELECT 
        p.id, p.title, p.description, p.price, p.address, p.city, p.state, p.country, 
        p.zip_code, p.type, p.room as rooms, p.bathrooms, p.square_meters as "squareMeters",
        NULL as image_url,
        p.status, p.created_at, p.updated_at, p.year_built as yearBuilt, 
        p.geocode, p.seller_id, p.operation_status_id,
        pos.name as operation_status, pos.display_name as operation_status_display
      FROM properties p
      LEFT JOIN property_operation_statuses pos ON p.operation_status_id = pos.id
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
    return NextResponse.json(property);
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
    const body = await req.json();

    // Basic payload validation (keep minimal to avoid blocking)
    const allowedFields = ['title','description','price','address','city','state','country','zip_code','type','room','bathrooms','square_meters','lat','lng','status','operation_status_id','property_type_id','property_status_id','seller_id'];

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${idx}`);
        values.push((body as any)[key]);
        idx++;
      }
    }

    if (fields.length > 0) {
      const updateQuery = `UPDATE properties SET ${fields.join(', ')} , updated_at = NOW() WHERE id = $${idx} RETURNING id`;
      values.push(id);
      await query(updateQuery, values);
    }

    // Handle features update (optional)
    if (Array.isArray(body.features)) {
      // Delete existing
      await query('DELETE FROM property_feature_assignments WHERE property_id = $1', [id]);
      // Insert new
      for (const f of body.features) {
        await query('INSERT INTO property_feature_assignments(property_id, feature_id) VALUES($1, $2)', [id, f]);
      }
    }

    // Return the updated property using same logic as GET (call DB)
    const propertyQuery = `
      SELECT 
        p.id, p.title, p.description, p.price, p.address, p.city, p.state, p.country, 
        p.zip_code, p.type, p.room as rooms, p.bathrooms, p.square_meters as "squareMeters",
        NULL as image_url,
        p.status, p.created_at, p.updated_at, p.year_built as yearBuilt, 
        p.geocode, p.seller_id, p.operation_status_id,
        pos.name as operation_status, pos.display_name as operation_status_display
      FROM properties p
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

    log.info('property update handler finished', { propertyId: id });
    return NextResponse.json(property);
  } catch (error) {
    log.error('Error updating property', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
