import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';

// This endpoint handles deletion of properties
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Only allow DELETE method
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the property ID and seller_id from the request
  const { id } = req.query;
  const { seller_id } = req.body;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Property ID is required' });
  }
  
  if (!seller_id) {
    return res.status(400).json({ error: 'Seller ID is required' });
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

    // Check if property exists and belongs to the seller
    const checkQuery = `
      SELECT id, seller_id FROM properties WHERE id = $1
    `;
    const checkResult = await client.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Verify that the logged-in user is the owner of this property
    const property = checkResult.rows[0];
    if (property.seller_id !== seller_id) {
      return res.status(403).json({ error: 'You can only delete your own properties' });
    }

    // Delete the property
    const deleteQuery = `
      DELETE FROM properties WHERE id = $1 AND seller_id = $2 RETURNING id
    `;
    
    const result = await client.query(deleteQuery, [id, seller_id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Property not found or already deleted' });
    }
    
    res.status(200).json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.end();
  }
};

export default handler;
