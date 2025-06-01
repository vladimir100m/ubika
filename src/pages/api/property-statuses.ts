import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    const query = `
      SELECT id, name, display_name, description, color
      FROM property_statuses
      ORDER BY display_name
    `;

    const result = await client.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching property statuses:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.end();
  }
};

export default handler;
