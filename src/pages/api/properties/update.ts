import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/db';
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

  try {

    const propertyData = req.body;
    
    // Require seller_id for authorization
    if (!propertyData.seller_id) {
      return res.status(400).json({ error: 'Seller ID is required' });
    }
    
    // Check if property exists and belongs to the seller
    const checkQuery = `
      SELECT id, seller_id FROM properties WHERE id = $1
    `;
    const checkResult = await query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Verify that the logged-in user is the owner of this property
    const property = checkResult.rows[0];
    if (property.seller_id !== propertyData.seller_id) {
      return res.status(403).json({ error: 'You can only update your own properties' });
    }

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
    if (propertyData.squareMeters !== undefined) {
      const sqVal = parseInt(String(propertyData.squareMeters), 10);
      if (!isNaN(sqVal)) {
        updateFields.push(`square_meters = $${paramCounter}`);
        queryParams.push(sqVal);
        paramCounter++;
      }
    }
    // Note: image_url column doesn't exist in database, skipping
    addFieldIfExists('status');
    addFieldIfExists('operation_status_id');
    addFieldIfExists('yearBuilt', 'year_built');
    
    // Always update the updated_at timestamp
    updateFields.push(`updated_at = $${paramCounter}`);
    queryParams.push(new Date().toISOString());
    paramCounter++;

    // Add the property ID and seller_id as the last parameters
    queryParams.push(id);
    queryParams.push(propertyData.seller_id);

    // If no fields to update, return an error
    if (updateFields.length === 1) { // Only updated_at field
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Build and execute the update query
  const updateQuery = `
      UPDATE properties 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCounter} AND seller_id = $${paramCounter + 1}
      RETURNING id, title, description, price, address, city, state, country, 
                zip_code, type, room as rooms, bathrooms,
                square_meters as "squareMeters",
                CASE 
                  WHEN type = 'house' THEN '/properties/casa-moderna.jpg'
                  WHEN type = 'apartment' THEN '/properties/apartamento-moderno.jpg'
                  WHEN type = 'cabin' THEN '/properties/cabana-bosque.jpg'
                  WHEN type = 'villa' THEN '/properties/villa-lujo.jpg'
                  WHEN type = 'penthouse' THEN '/properties/penthouse-lujo.jpg'
                  WHEN type = 'loft' THEN '/properties/loft-urbano.jpg'
                  WHEN type = 'duplex' THEN '/properties/duplex-moderno.jpg'
                  ELSE '/properties/casa-moderna.jpg'
                END as image_url,
                status, created_at, updated_at, year_built as yearBuilt, 
                seller_id
    `;
    
    const result = await query(updateQuery, queryParams);
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
