import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';
import { Property, PropertyFormData } from '../../../types';

// This endpoint handles creation of new properties
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = new Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: String(process.env.POSTGRES_PASSWORD),
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  });

  try {
    await client.connect();

    const propertyData: PropertyFormData = req.body;
    
    // Basic validation
    if (!propertyData.title || !propertyData.description || !propertyData.price || !propertyData.address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Handle image_url - could be a URL, base64 string, or empty
    let imageUrl = propertyData.image_url || '/properties/casa-moderna.jpg'; // Default image if none provided
    
    // In a real application, here is where you would upload the image to a cloud storage
    // service if it's a base64 string, then use the returned URL
    // For now, we'll just use the string as is (URL or base64)

    // Insert new property
    const query = `
      INSERT INTO properties (
        title, description, price, address, city, state, country, 
        zip_code, type, room, bathrooms, area, image_url, status, 
        year_built, seller_id, created_at, updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id, title, description, price, address`;
    
    const now = new Date().toISOString();
    
    const values = [
      propertyData.title,
      propertyData.description,
      propertyData.price,
      propertyData.address,
      propertyData.city,
      propertyData.state,
      propertyData.country,
      propertyData.zip_code || '',
      propertyData.type,
      propertyData.rooms,
      propertyData.bathrooms,
      propertyData.squareMeters,
      imageUrl, // Use our processed imageUrl
      propertyData.status,
      propertyData.yearBuilt || null,
      propertyData.seller_id,
      now,
      now
    ];
    
    const result = await client.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.end();
  }
};

export default handler;
