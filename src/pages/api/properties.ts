import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'ubika',
    password: 'admin',
    port: 5432,
  });

  try {
    await client.connect();

    const result = await client.query('SELECT * FROM properties');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.end();
  }
};

export default handler;