import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { city, name } = req.query;

  const client = new Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: String(process.env.POSTGRES_PASSWORD),
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  });

  try {
    await client.connect();

    let query = `
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
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY city, name`;

    const result = await client.query(query, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.end();
  }
};

export default handler;
