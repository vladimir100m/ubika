import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { propertyId, featureIds, seller_id } = req.body;

  if (!propertyId || !featureIds || !seller_id) {
    return res.status(400).json({ error: 'Property ID, feature IDs, and seller ID are required' });
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

    // Verify that the property belongs to the seller
    const propertyCheck = await client.query(
      'SELECT id FROM properties WHERE id = $1 AND seller_id = $2',
      [propertyId, seller_id]
    );

    if (propertyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You can only update features for your own properties' });
    }

    // Start transaction
    await client.query('BEGIN');

    try {
      // Remove existing feature assignments for this property
      await client.query(
        'DELETE FROM property_feature_assignments WHERE property_id = $1',
        [propertyId]
      );

      // Add new feature assignments
      if (featureIds.length > 0) {
        const insertPromises = featureIds.map((featureId: number) =>
          client.query(
            'INSERT INTO property_feature_assignments (property_id, feature_id) VALUES ($1, $2)',
            [propertyId, featureId]
          )
        );

        await Promise.all(insertPromises);
      }

      // Commit transaction
      await client.query('COMMIT');

      res.status(200).json({ success: true, message: 'Property features updated successfully' });
    } catch (error) {
      // Rollback transaction
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating property features:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.end();
  }
};

export default handler;
