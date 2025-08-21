import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { query } from '../../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, {
      // Basic auth options for server session
      providers: [],
      callbacks: {
        session: ({ session, token }) => ({
          ...session,
          user: {
            ...session.user,
            sub: token.sub
          }
        })
      }
    });
    
    if (!session || !session.user || !session.user.sub) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const userId = session.user.sub;

    if (req.method === 'DELETE') {
      const { propertyId } = req.body;

      if (!propertyId) {
        return res.status(400).json({ error: 'Property ID is required' });
      }

      try {
        await query(
          'DELETE FROM user_saved_properties WHERE user_id = $1 AND property_id = $2',
          [userId, propertyId]
        );

        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error unsaving property:', error);
        res.status(500).json({ error: 'Failed to unsave property' });
      }
      return;
    }

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

    } else if (req.method === 'GET') {
      // Get all saved properties for user
      try {
        const result = await query(
          `SELECT p.id, p.title, p.description, p.price, p.address, p.city, p.state, p.country, 
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
           pos.name as operation_status, pos.display_name as operation_status_display,
           usp.saved_at 
           FROM user_saved_properties usp
           JOIN properties p ON usp.property_id = p.id
           LEFT JOIN property_operation_statuses pos ON p.operation_status_id = pos.id
           WHERE usp.user_id = $1
           ORDER BY usp.saved_at DESC`,
          [userId]
        );

        res.status(200).json(result.rows);
      } catch (error) {
        console.error('Error fetching saved properties:', error);
        res.status(500).json({ error: 'Failed to fetch saved properties' });
      }

    } 
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
