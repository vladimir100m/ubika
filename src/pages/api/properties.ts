import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';
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
  const client = new Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: String(process.env.POSTGRES_PASSWORD),
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  });

  try {
    await client.connect();

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
    let query = `
      SELECT 
        p.id, p.title, p.description, p.price, p.address, p.city, p.state, p.country, 
        p.zip_code, p.type, p.room as rooms, p.bathrooms, p.area as squareMeters, 
        p.image_url, p.status, p.created_at, p.updated_at, p.year_built as yearBuilt, 
        p.geocode, p.seller_id
      FROM properties p
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters.minPrice) {
      // Remove currency symbols and convert to number for comparison
      query += ` AND CAST(REPLACE(REPLACE(p.price, '$', ''), ',', '') AS NUMERIC) >= $${paramIndex}`;
      queryParams.push(parseFloat(filters.minPrice));
      paramIndex++;
    }

    if (filters.maxPrice) {
      query += ` AND CAST(REPLACE(REPLACE(p.price, '$', ''), ',', '') AS NUMERIC) <= $${paramIndex}`;
      queryParams.push(parseFloat(filters.maxPrice));
      paramIndex++;
    }

    if (filters.bedrooms) {
      query += ` AND p.room >= $${paramIndex}`;
      queryParams.push(parseInt(filters.bedrooms));
      paramIndex++;
    }

    if (filters.bathrooms) {
      query += ` AND p.bathrooms >= $${paramIndex}`;
      queryParams.push(parseInt(filters.bathrooms));
      paramIndex++;
    }

    if (filters.propertyType) {
      // Property type filter should match against property_types table
      query += ` AND EXISTS (
        SELECT 1 FROM property_types pt 
        WHERE pt.id = $${paramIndex} AND LOWER(p.type) = LOWER(pt.name)
      )`;
      queryParams.push(parseInt(filters.propertyType));
      paramIndex++;
    }

    if (filters.operation) {
      // Assuming we have an operation field or derive from status/price patterns
      if (filters.operation === 'rent') {
        query += ` AND (p.status = 'available' AND LOWER(p.description) LIKE '%alquiler%')`;
      } else if (filters.operation === 'sale') {
        query += ` AND (p.status = 'available' AND LOWER(p.description) NOT LIKE '%alquiler%')`;
      }
    }

    if (filters.zone) {
      query += ` AND (LOWER(p.city) LIKE LOWER($${paramIndex}) OR LOWER(p.address) LIKE LOWER($${paramIndex}))`;
      queryParams.push(`%${filters.zone}%`);
      paramIndex++;
    }

    if (filters.minArea) {
      query += ` AND p.area >= $${paramIndex}`;
      queryParams.push(parseInt(filters.minArea));
      paramIndex++;
    }

    if (filters.maxArea) {
      query += ` AND p.area <= $${paramIndex}`;
      queryParams.push(parseInt(filters.maxArea));
      paramIndex++;
    }

    // Add ordering
    query += ` ORDER BY p.created_at DESC`;

    console.log('Executing query:', query);
    console.log('Query params:', queryParams);

    const result = await client.query<Property>(query, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.end();
  }
};

export default handler;