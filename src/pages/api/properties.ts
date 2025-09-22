import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../utils/db';
import loggerModule, { createRequestId, createLogger } from '../../utils/logger';
import { resolveImageUrl } from '../../utils/blob';
import { Property } from '../../types';
import { cacheGet, cacheSet } from '../../utils/cache';
import { createHash } from 'crypto';

interface PropertyFilters {
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  propertyType?: string;
  operation?: string; // 'sale' or 'rent'
  zone?: string; // neighborhood/city filter
  minArea?: string;
  maxArea?: string;
}

const handler = async (req: NextApiRequest, res: NextApiResponse<Property[] | { error: string }>) => {
  const reqId = createRequestId('req-');
  const log = createLogger(reqId);
  log.info('properties handler start', { method: req.method, url: req.url });

  try {
    // Extract filters from query parameters
    const filters: PropertyFilters = {
      minPrice: req.query.minPrice as string,
      maxPrice: req.query.maxPrice as string,
      bedrooms: req.query.bedrooms as string,
      bathrooms: req.query.bathrooms as string,
      propertyType: req.query.propertyType as string,
      operation: req.query.operation as string,
      zone: req.query.zone as string,
      minArea: req.query.minArea as string,
      maxArea: req.query.maxArea as string,
    };

  // Build dynamic query with image support
    let queryText = `
      SELECT 
        p.id, p.title, p.description, p.price, p.address, p.city, p.state, p.country, 
        p.zip_code, p.type, p.room as rooms, p.bathrooms, p.square_meters as "squareMeters",
  -- No static sample image; leave image_url NULL so uploaded images are used if present
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

    // Apply filters
    if (filters.minPrice) {
      // p.price is stored as numeric in the database; compare directly using a numeric param
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
      // Property type filter should match against property_types table
      queryText += ` AND LOWER(p.type) LIKE LOWER($${paramIndex})`;
      queryParams.push(filters.propertyType);
      paramIndex++;
    }

    if (filters.operation) {
      // Use the new operation_status_id field
      if (filters.operation === 'rent') {
        queryText += ` AND p.operation_status_id = 2`;
      } else if (filters.operation === 'sale' || filters.operation === 'buy') {
        queryText += ` AND p.operation_status_id = 1`;
      }
    }

    if (filters.zone) {
      queryText += ` AND (LOWER(p.city) LIKE LOWER($${paramIndex}) OR LOWER(p.address) LIKE LOWER($${paramIndex}))`;
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

  // Add ordering
  queryText += ` ORDER BY p.created_at DESC`;

  log.debug('Built properties query', { queryText: queryText.replace(/\s+/g, ' ').trim(), queryParams });
      // Try cache first
    const defaultTtl = parseInt(process.env.PROPERTIES_CACHE_TTL || '60', 10); // seconds
    const keyHash = createHash('sha1').update(queryText + JSON.stringify(queryParams)).digest('hex');
    const cacheKey = `properties:${keyHash}`;
    try {
      const cached = await cacheGet<Property[]>(cacheKey);
      if (cached) {
        log.info('Cache hit', { cacheKey });
        return res.status(200).json(cached);
      }
      log.debug('Cache miss', { cacheKey });
    } catch (e) {
      log.warn('Cache get failed, continuing to DB', e);
    }

    const qStart = Date.now();
    const result = await query(queryText, queryParams);
    const qMs = Date.now() - qStart;
    log.info('DB query executed', { durationMs: qMs });

    const properties = result.rows;

    // Fetch images for each property
    for (const property of properties) {
      const imgLog = createLogger(`${reqId}-img-${property.id}`);
      try {
        imgLog.debug('Fetching images for property');
        const imagesResult = await query(
          'SELECT id, property_id, image_url, is_cover, display_order, created_at, updated_at FROM property_images WHERE property_id = $1 ORDER BY is_cover DESC, display_order ASC',
          [property.id]
        );
        // Resolve stored image_url values to public URLs when possible
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
        imgLog.debug('Images fetched', { count: imgs.length });
      } catch (imageError) {
        imgLog.error('Failed to fetch images for property', { propertyId: property.id, error: imageError });
        property.images = [];
      }
    }

    // Populate cache with resolved images
    try {
      await cacheSet(cacheKey, properties, defaultTtl);
      log.debug('Cache set', { cacheKey, ttl: defaultTtl });
    } catch (e) {
      log.warn('Cache set failed', e);
    }

    log.info('properties handler finished', { resultCount: properties.length });
    res.status(200).json(properties);
  } catch (error) {
    log.error('Error fetching properties', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
