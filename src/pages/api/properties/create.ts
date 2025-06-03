import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/db';
import { Property, PropertyFormData } from '../../../types';

// This endpoint handles creation of new properties
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {

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
    const insertQuery = `
      INSERT INTO properties (
        title, description, price, address, city, state, country, 
        zip_code, type, room, bathrooms, area, image_url, status, 
        year_built, seller_id, operation_status_id, created_at, updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
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
      propertyData.operation_status_id || 1, // Default to Sale (1) if not provided
      now,
      now
    ];
    
    const result = await query(insertQuery, values);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
