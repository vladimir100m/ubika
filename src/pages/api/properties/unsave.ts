import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { query } from '../../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
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

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}