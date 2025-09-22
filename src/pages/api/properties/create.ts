import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/db';
import { Property, PropertyFormData } from '../../../types';
import loggerModule, { createRequestId, createLogger } from '../../../utils/logger';

// This endpoint handles creation of new properties
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const reqId = createRequestId('req-');
  const log = createLogger(reqId);
  log.info('property create handler start', { method: req.method, url: req.url });

  try {

    const propertyData: PropertyFormData = req.body;
    
    // Basic validation
    if (!propertyData.title || !propertyData.description || !propertyData.price || !propertyData.address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Require squareMeters (frontend marks it required). If absent, respond clearly.
    if (propertyData.squareMeters === undefined || propertyData.squareMeters === null || isNaN(Number(propertyData.squareMeters))) {
      return res.status(400).json({ error: 'squareMeters is required and must be a number' });
    }

    // Note: image_url column doesn't exist in the database
    // Images will be handled through the CASE statement in queries that fetch properties
    
    // Insert new property (standardized schema using square_meters only)
    const insertQuery = `
      INSERT INTO properties (
        title, description, price, address, city, state, country,
        zip_code, type, room, bathrooms, square_meters, status,
        year_built, seller_id, operation_status_id, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,$13,
        $14,$15,$16,$17,$18
      )
      RETURNING id, title, description, price, address`;
    
    const now = new Date().toISOString();
    
    const roomsVal = parseInt(String(propertyData.rooms ?? 0), 10) || 0;
    const bathsVal = parseInt(String(propertyData.bathrooms ?? 0), 10) || 0;
    const sqVal = parseInt(String(propertyData.squareMeters), 10) || 0;

    const values: any[] = [
      propertyData.title,
      propertyData.description,
      propertyData.price,
      propertyData.address,
      propertyData.city || '',
      propertyData.state || '',
      propertyData.country || '',
      propertyData.zip_code || '',
      propertyData.type || '',
      roomsVal,
      bathsVal,
      sqVal,
      propertyData.status,
      propertyData.yearBuilt || null,
      propertyData.seller_id,
      propertyData.operation_status_id || 1,
      now,
      now
    ];
    
    log.debug('Inserting property', { title: propertyData.title, seller_id: propertyData.seller_id });
    const qStart = Date.now();
    const result = await query(insertQuery, values);
    log.info('Property inserted', { durationMs: Date.now() - qStart, id: result.rows[0]?.id });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    log.error('Error creating property', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
