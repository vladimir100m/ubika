import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@auth0/nextjs-auth0';
import { query } from '../../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const userId = session.user.sub;
    const { propertyIds } = req.body;

    if (!propertyIds || !Array.isArray(propertyIds)) {
      return res.status(400).json({ error: 'Property IDs array is required' });
    }

    try {
      // Create placeholders for the IN clause
      const placeholders = propertyIds.map((_, index) => `$${index + 2}`).join(',');
      
      const result = await query(
        `SELECT property_id FROM user_saved_properties 
         WHERE user_id = $1 AND property_id IN (${placeholders})`,
        [userId, ...propertyIds]
      );

      const savedPropertyIds = result.rows.map((row: any) => row.property_id);
      res.status(200).json({ savedPropertyIds });
    } catch (error) {
      console.error('Error checking saved status:', error);
      res.status(500).json({ error: 'Failed to check saved status' });
    }

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
