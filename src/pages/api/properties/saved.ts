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
  try {
    await client.connect();
    
    // Get user session
    const session = getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const userId = session.user.sub;

    switch (req.method) {
      case 'GET':
        // Get all saved properties for user
        try {
          const query = `
            SELECT p.*, usp.saved_at
            FROM user_saved_properties usp
            JOIN properties p ON usp.property_id = p.id
            WHERE usp.user_id = $1
            ORDER BY usp.saved_at DESC
          `;
          const result = await client.query(query, [userId]);
          res.status(200).json(result.rows);
        } catch (error) {
          console.error('Error fetching saved properties:', error);
          res.status(500).json({ error: 'Failed to fetch saved properties' });
        }
        break;

      case 'POST':
        // Save a property
        const { propertyId } = req.body;
        
        if (!propertyId) {
          return res.status(400).json({ error: 'Property ID is required' });
        }

        try {
          // Check if property exists
          const propertyCheck = await client.query('SELECT id FROM properties WHERE id = $1', [propertyId]);
          if (propertyCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
          }

          // Insert saved property (will fail if already exists due to unique constraint)
          const insertQuery = `
            INSERT INTO user_saved_properties (user_id, property_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, property_id) DO NOTHING
            RETURNING *
          `;
          const result = await client.query(insertQuery, [userId, propertyId]);
          
          if (result.rows.length > 0) {
            res.status(201).json({ message: 'Property saved successfully', data: result.rows[0] });
          } else {
            res.status(200).json({ message: 'Property already saved' });
          }
        } catch (error) {
          console.error('Error saving property:', error);
          res.status(500).json({ error: 'Failed to save property' });
        }
        break;

      case 'DELETE':
        // Unsave a property
        const { propertyId: deletePropertyId } = req.query;
        
        if (!deletePropertyId) {
          return res.status(400).json({ error: 'Property ID is required' });
        }

        try {
          const deleteQuery = `
            DELETE FROM user_saved_properties
            WHERE user_id = $1 AND property_id = $2
            RETURNING *
          `;
          const result = await client.query(deleteQuery, [userId, deletePropertyId]);
          
          if (result.rows.length > 0) {
            res.status(200).json({ message: 'Property unsaved successfully' });
          } else {
            res.status(404).json({ error: 'Saved property not found' });
          }
        } catch (error) {
          console.error('Error unsaving property:', error);
          res.status(500).json({ error: 'Failed to unsave property' });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  } finally {
    await client.end();
  }
}
