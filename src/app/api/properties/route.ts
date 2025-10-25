import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import { createRequestId, createLogger } from '../../../lib/logger';
import { resolveImageUrl } from '../../../lib/blob';
import { Property } from '../../../types';
import { cacheGet, cacheSet, cacheInvalidatePattern, cacheDel } from '../../../lib/cache';
import { createHash } from 'crypto';

interface PropertyFilters {
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  propertyType?: string;
  operation?: string;
  zone?: string;
  minArea?: string;
  maxArea?: string;
}

export async function GET(req: NextRequest) {
  const reqId = createRequestId('req-');
  const log = createLogger(reqId);
  log.info('properties handler start', { method: req.method, url: req.url });

  try {
    const searchParams = req.nextUrl.searchParams;
    const seller_id = searchParams.get('seller') || undefined;
    log.info('Properties filter parameters', { seller_id });
    
    const filters: PropertyFilters = {
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      bedrooms: searchParams.get('bedrooms') || undefined,
      bathrooms: searchParams.get('bathrooms') || undefined,
      propertyType: searchParams.get('propertyType') || undefined,
      operation: searchParams.get('operation') || undefined,
      zone: searchParams.get('zone') || undefined,
      minArea: searchParams.get('minArea') || undefined,
      maxArea: searchParams.get('maxArea') || undefined,
    };

    let queryText = `
      SELECT 
        p.id, p.title, p.description, p.price, p.address, p.city, p.state, p.country, 
        p.zip_code, p.type, p.room as rooms, p.bathrooms, p.square_meters as "squareMeters",
        NULL as image_url,
        p.status, p.created_at, p.updated_at, p.year_built as yearBuilt, 
        p.geocode, p.seller_id, p.operation_status_id,
        pos.name as operation_status, pos.display_name as operation_status_display
      FROM properties p
      LEFT JOIN property_operation_statuses pos ON p.operation_status_id = pos.id
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    if (filters.minPrice) {
      queryText += ` AND p.price >= $${paramIndex}`;
      queryParams.push(parseFloat(filters.minPrice));
      paramIndex++;
    }

    if (filters.maxPrice) {
      queryText += ` AND p.price <= $${paramIndex}`;
      queryParams.push(parseFloat(filters.maxPrice));
      paramIndex++;
    }

    if (filters.bedrooms) {
      queryText += ` AND p.room >= $${paramIndex}`;
      queryParams.push(parseInt(filters.bedrooms, 10));
      paramIndex++;
    }

    if (filters.bathrooms) {
      queryText += ` AND p.bathrooms >= $${paramIndex}`;
      queryParams.push(parseInt(filters.bathrooms, 10));
      paramIndex++;
    }

    if (filters.propertyType) {
      queryText += ` AND LOWER(p.type) LIKE LOWER($${paramIndex})`;
      queryParams.push(filters.propertyType);
      paramIndex++;
    }

    if (filters.operation) {
      if (filters.operation === 'rent') {
        queryText += ` AND p.operation_status_id = 2`;
      } else if (filters.operation === 'sale' || filters.operation === 'buy') {
        queryText += ` AND p.operation_status_id = 1`;
      }
    }

    if (filters.zone) {
      queryText += ` AND (LOWER(p.city) LIKE LOWER($${paramIndex}) OR LOWER(p.state) LIKE LOWER($${paramIndex}) OR LOWER(p.address) LIKE LOWER($${paramIndex}))`;
      queryParams.push(`%${filters.zone}%`);
      paramIndex++;
    }

    if (filters.minArea) {
      queryText += ` AND p.square_meters >= $${paramIndex}`;
      queryParams.push(parseInt(filters.minArea, 10));
      paramIndex++;
    }

    if (filters.maxArea) {
      queryText += ` AND p.square_meters <= $${paramIndex}`;
      queryParams.push(parseInt(filters.maxArea, 10));
      paramIndex++;
    }

    // Filter by seller if provided (for seller dashboard)
    if (seller_id) {
      queryText += ` AND p.seller_id = $${paramIndex}`;
      queryParams.push(seller_id);
      paramIndex++;
      log.info('Added seller filter', { seller_id, paramIndex: paramIndex - 1 });
    }

    queryText += ' ORDER BY p.created_at DESC';

    // Build cache key - include seller_id for better cache granularity
    let cacheKeyBase = `properties:list`;
    if (seller_id) {
      cacheKeyBase = `seller:${seller_id}:properties:list`;
    }
    const cacheKey = `${cacheKeyBase}:${createHash('sha256').update(queryText + JSON.stringify(queryParams)).digest('hex')}`;
    
    log.info('Cache key generated', { cacheKey, seller_id, hasFilters: Object.values(filters).some(v => v) });
    const cachedData = await cacheGet(cacheKey);

    if (cachedData) {
      log.info('Returning cached properties data', { cacheKey, seller_id });
      const response = NextResponse.json(cachedData);
      response.headers.set('Cache-Control', 'private, max-age=300');
      return response;
    }

    const { rows } = await query(queryText, queryParams);

    const propertyIds = rows.map((p: Property) => p.id);
    let images: any[] = [];
    if (propertyIds.length > 0) {
      const imageQuery = `
        SELECT property_id, image_url, is_cover, display_order
        FROM property_images
        WHERE property_id = ANY($1)
      `;
      const { rows: imageRows } = await query(imageQuery, [propertyIds]);
      images = imageRows;
    }

    const propertiesWithImages = await Promise.all(rows.map(async (p: Property) => {
      const propertyImages = images.filter(img => img.property_id === p.id);
      const resolvedImages = await Promise.all(propertyImages.map(async (img) => ({
        ...img,
        image_url: await resolveImageUrl(img.image_url)
      })));
      return {
        ...p,
        images: resolvedImages,
      };
    }));

    await cacheSet(cacheKey, propertiesWithImages, 300);
    log.info('Returning properties from DB');
    const response = NextResponse.json(propertiesWithImages);
    response.headers.set('Cache-Control', 'private, max-age=300');
    return response;

  } catch (error) {
    log.error('Error fetching properties', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const reqId = createRequestId('req-');
  const log = createLogger(reqId);
  log.info('create property handler start', { method: req.method, url: req.url });

  try {
    const body = await req.json();

    // Minimal required fields
    const title = body.title || '';
    const description = body.description || '';
    const price = body.price || 0;
    const address = body.address || '';
    const city = body.city || '';
    const seller_id = body.seller_id || null;

    if (!title || !address || !seller_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const insertQuery = `
      INSERT INTO properties (title, description, price, address, city, type, room, bathrooms, square_meters, seller_id, status, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'available', NOW(), NOW())
      RETURNING id
    `;

    const values = [
      title,
      description,
      price,
      address,
      city,
      body.property_type_id ? String(body.property_type_id) : body.type || null,
      body.bedrooms || 0,
      body.bathrooms || 0,
      body.sq_meters || 0,
      seller_id
    ];

    const result = await query(insertQuery, values);
    const newId = result.rows[0].id;

    // Return the full property via select used in GET (single property)
    const propertyQuery = `
      SELECT p.id, p.title, p.description, p.price, p.address, p.city, p.state, p.country, 
        p.zip_code, p.type, p.room as rooms, p.bathrooms, p.square_meters as "squareMeters",
        p.status, p.created_at, p.updated_at, p.year_built as yearBuilt, 
        p.geocode, p.seller_id, p.operation_status_id
      FROM properties p WHERE p.id = $1`;

    const propRes = await query(propertyQuery, [newId]);
    const prop = propRes.rows[0];

    // Attach empty images array
    prop.images = [];

    // Invalidate cache when new property is created
    try {
      // Invalidate seller's specific property lists
      await cacheInvalidatePattern(`seller:${seller_id}:properties:list:*`);
      // Invalidate all public property listings
      await cacheInvalidatePattern(`properties:list:*`);
      // Also invalidate without pattern (just in case)
      await cacheDel(`properties:list`);
      await cacheDel(`seller:${seller_id}:properties:list`);
      log.info('Cache invalidated after property creation', { propertyId: newId, sellerId: seller_id });
    } catch (e) {
      log.warn('Failed to invalidate cache after property creation', { error: e });
    }

    log.info('property created', { id: newId });
    return NextResponse.json(prop);
  } catch (error) {
    log.error('Error creating property', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
