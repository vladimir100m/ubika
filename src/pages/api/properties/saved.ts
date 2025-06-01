import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@auth0/nextjs-auth0';
import { query } from '../../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const userId = session.user.sub;

    if (req.method === 'POST') {
      // Save a property
      const { propertyId } = req.body;

      if (!propertyId) {
        return res.status(400).json({ error: 'Property ID is required' });
      }

      try {
        await query(
          'INSERT INTO user_saved_properties (user_id, property_id) VALUES ($1, $2) ON CONFLICT (user_id, property_id) DO NOTHING',
          [userId, propertyId]
        );

        res.status(200).json({ message: 'Property saved successfully' });
      } catch (error) {
        console.error('Error saving property:', error);
        res.status(500).json({ error: 'Failed to save property' });
      }

    } else if (req.method === 'DELETE') {
      // Remove a saved property
      const { propertyId } = req.body;

      if (!propertyId) {
        return res.status(400).json({ error: 'Property ID is required' });
      }

      try {
        await query(
          'DELETE FROM user_saved_properties WHERE user_id = $1 AND property_id = $2',
          [userId, propertyId]
        );

        res.status(200).json({ message: 'Property removed successfully' });
      } catch (error) {
        console.error('Error removing property:', error);
        res.status(500).json({ error: 'Failed to remove property' });
      }

    } else if (req.method === 'GET') {
      // Get all saved properties for user
      try {
        const result = await query(
          `SELECT p.*, usp.saved_at 
           FROM user_saved_properties usp
           JOIN properties p ON usp.property_id = p.id
           WHERE usp.user_id = $1
           ORDER BY usp.saved_at DESC`,
          [userId]
        );

        res.status(200).json(result.rows);
      } catch (error) {
        console.error('Error fetching saved properties:', error);
        res.status(500).json({ error: 'Failed to fetch saved properties' });
      }

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
