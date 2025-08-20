import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';

interface PropertyFeature {
  id: number;
  name: string;
  category: string;
  icon: string;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { propertyId } = req.query;

  if (!propertyId) {
    return res.status(400).json({ error: 'Property ID is required' });
  }

  const client = new Client({
    user: process.env.POSTGRES_USER || 'admin',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'ubika',
    password: process.env.POSTGRES_PASSWORD || 'admin',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  });

  try {
    await client.connect();

    const query = `
      SELECT pf.id, pf.name, pf.category, pf.icon
      FROM property_features pf
      INNER JOIN property_feature_assignments pfa ON pf.id = pfa.feature_id
      WHERE pfa.property_id = $1
      ORDER BY pf.category, pf.name
    `;

    const result = await client.query(query, [propertyId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching property features:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.end();
  }
};

export default handler;
