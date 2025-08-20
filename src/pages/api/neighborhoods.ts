import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../utils/db';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { city, name } = req.query;

  try {
    let queryText = `
      SELECT id, name, city, state, country, description, subway_access, 
             dining_options, schools_info, shopping_info, parks_recreation,
             safety_rating, walkability_score
      FROM neighborhoods
    `;
    
    const queryParams: string[] = [];
    const conditions: string[] = [];

    if (city) {
      conditions.push(`city ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${city}%`);
    }

    if (name) {
      conditions.push(`name ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${name}%`);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryText += ` ORDER BY city, name`;

    const result = await query(queryText, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
