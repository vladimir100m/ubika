import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../utils/db';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { propertyId, featureIds, seller_id } = req.body;

  if (!propertyId || !featureIds || !seller_id) {
    return res.status(400).json({ error: 'Property ID, feature IDs, and seller ID are required' });
  }

  try {
    // Verify that the property belongs to the seller
    const propertyCheck = await query(
      'SELECT id FROM properties WHERE id = $1 AND seller_id = $2',
      [propertyId, seller_id]
    );

    if (propertyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You can only update features for your own properties' });
    }

    // Remove existing feature assignments for this property
    await query(
      'DELETE FROM property_feature_assignments WHERE property_id = $1',
      [propertyId]
    );

    // Add new feature assignments
    if (featureIds.length > 0) {
      for (const featureId of featureIds) {
        await query(
          'INSERT INTO property_feature_assignments (property_id, feature_id) VALUES ($1, $2)',
          [propertyId, featureId]
        );
      }
    }
    res.status(200).json({ success: true, message: 'Property features updated successfully' });
  } catch (error) {
    console.error('Error updating property features:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
