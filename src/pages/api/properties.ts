import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../utils/db';
import { Property } from '../../types';

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

    // Build dynamic query
    let queryText = `
      SELECT 
        p.id, p.title, p.description, p.price, p.address, p.city, p.state, p.country, 
        p.zip_code, p.type, p.room as rooms, p.bathrooms, p.area as squareMeters, 
        CASE 
          WHEN p.type = 'house' THEN '/properties/casa-moderna.jpg'
          WHEN p.type = 'apartment' THEN '/properties/apartamento-moderno.jpg'
          WHEN p.type = 'cabin' THEN '/properties/cabana-bosque.jpg'
          WHEN p.type = 'villa' THEN '/properties/villa-lujo.jpg'
          WHEN p.type = 'penthouse' THEN '/properties/penthouse-lujo.jpg'
          WHEN p.type = 'loft' THEN '/properties/loft-urbano.jpg'
          WHEN p.type = 'duplex' THEN '/properties/duplex-moderno.jpg'
          ELSE '/properties/casa-moderna.jpg'
        END as image_url,
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
      // Remove currency symbols and convert to number for comparison
      queryText += ` AND CAST(REPLACE(REPLACE(p.price, '$', ''), ',', '') AS NUMERIC) >= $${paramIndex}`;
      queryParams.push(parseFloat(filters.minPrice));
      paramIndex++;
    }

    if (filters.maxPrice) {
      queryText += ` AND CAST(REPLACE(REPLACE(p.price, '$', ''), ',', '') AS NUMERIC) <= $${paramIndex}`;
      queryParams.push(parseFloat(filters.maxPrice));
      paramIndex++;
      console.log(query, queryParams, filters);
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
      queryText += ` AND p.area >= $${paramIndex}`;
      queryParams.push(parseInt(filters.minArea, 10));
      paramIndex++;
    }

    if (filters.maxArea) {
      queryText += ` AND p.area <= $${paramIndex}`;
      queryParams.push(parseInt(filters.maxArea, 10));
      paramIndex++;
    }

    // Add ordering
    queryText += ` ORDER BY p.created_at DESC`;

    console.log('Executing query:', queryText);
    console.log('Query params:', queryParams);

    const result = await query(queryText, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
