import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';
import { getSession } from '@auth0/nextjs-auth0';

const client = new Client({
  user: process.env.POSTGRES_USER || 'admin',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'ubika',
  password: process.env.POSTGRES_PASSWORD || 'admin',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await client.connect();
    
    // Get user session
    const session = getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const userId = session.user.sub;
    const { propertyIds } = req.query;

    if (!propertyIds) {
      return res.status(400).json({ error: 'Property IDs are required' });
    }

    // Handle both single property ID and array of property IDs
    const idsArray = Array.isArray(propertyIds) ? propertyIds : [propertyIds];
    const numericIds = idsArray.map(id => parseInt(id as string)).filter(id => !isNaN(id));

    if (numericIds.length === 0) {
      return res.status(400).json({ error: 'Valid property IDs are required' });
    }

    try {
      // Get saved property IDs for the user
      const placeholders = numericIds.map((_, index) => `$${index + 2}`).join(',');
      const query = `
        SELECT property_id
        FROM user_saved_properties
        WHERE user_id = $1 AND property_id IN (${placeholders})
      `;
      const params = [userId, ...numericIds];
      const result = await client.query(query, params);
      
      const savedIds = result.rows.map(row => row.property_id);
      
      // Return object with property ID as key and boolean as value
      const response = numericIds.reduce((acc, id) => {
        acc[id] = savedIds.includes(id);
        return acc;
      }, {} as Record<number, boolean>);

      res.status(200).json(response);
    } catch (error) {
      console.error('Error checking saved properties:', error);
      res.status(500).json({ error: 'Failed to check saved properties' });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  } finally {
    await client.end();
  }
}
