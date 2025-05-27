import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';
import { Property } from '../../../types';

// This endpoint handles updating existing properties
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Only allow PUT method
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the property ID from the query
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Property ID is required' });
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

    const propertyData = req.body;
    
    // Check if property exists and belongs to the seller
    const checkQuery = `
      SELECT id, seller_id FROM properties WHERE id = $1
    `;
    const checkResult = await client.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // In a real app, verify that the logged-in user is the owner of this property
    // For now, we'll skip that check since we're using a mock seller ID

    // Build the update query dynamically based on the fields that are provided
    const updateFields = [];
    const queryParams = [];
    let paramCounter = 1;

    // Helper to add a field to the update if it exists in the request
    const addFieldIfExists = (fieldName: string, dbFieldName?: string) => {
      if (propertyData[fieldName] !== undefined) {
        updateFields.push(`${dbFieldName || fieldName} = $${paramCounter}`);
        queryParams.push(propertyData[fieldName]);
        paramCounter++;
      }
    };

    // Add all possible fields
    addFieldIfExists('title');
    addFieldIfExists('description');
    addFieldIfExists('price');
    addFieldIfExists('address');
    addFieldIfExists('city');
    addFieldIfExists('state');
    addFieldIfExists('country');
    addFieldIfExists('zip_code');
    addFieldIfExists('type');
    addFieldIfExists('rooms', 'room');
    addFieldIfExists('bathrooms');
    addFieldIfExists('squareMeters', 'area');
    addFieldIfExists('image_url');
    addFieldIfExists('status');
    addFieldIfExists('yearBuilt', 'year_built');
    
    // Always update the updated_at timestamp
    updateFields.push(`updated_at = $${paramCounter}`);
    queryParams.push(new Date().toISOString());
    paramCounter++;

    // Add the property ID as the last parameter
    queryParams.push(id);

    // If no fields to update, return an error
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Build and execute the update query
    const updateQuery = `
      UPDATE properties 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCounter}
      RETURNING id, title, description, price, address, city, state, country, 
                zip_code, type, room as rooms, bathrooms, area as squareMeters, 
                image_url, status, created_at, updated_at, year_built as yearBuilt, 
                seller_id
    `;
    
    const result = await client.query(updateQuery, queryParams);
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.end();
  }
};

export default handler;
