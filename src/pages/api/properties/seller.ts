import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';
import { Property } from '../../../types';

const handler = async (req: NextApiRequest, res: NextApiResponse<Property[] | { error: string }>) => {
  const { seller_id } = req.query;

  if (!seller_id) {
    return res.status(400).json({ error: 'Seller ID is required' });
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
      SELECT 
        id, title, description, price, address, city, state, country, 
        zip_code, type, room as rooms, bathrooms, area as squareMeters, 
        image_url, status, created_at, updated_at, year_built as yearBuilt, 
        geocode, seller_id
      FROM properties 
      WHERE seller_id = $1
      ORDER BY created_at DESC
    `;

    const result = await client.query<Property>(query, [seller_id]);
    console.log(`Found ${result.rows.length} properties for seller ${seller_id}`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching seller properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.end();
  }
};

export default handler;
