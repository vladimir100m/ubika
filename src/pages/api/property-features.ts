import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../utils/db';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const queryText = `
      SELECT id, name, category, description, icon
      FROM property_features
      ORDER BY category, name
    `;

    const result = await query(queryText);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching property features:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
