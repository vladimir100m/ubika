import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/db';

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

  try {
    const queryText = `
      SELECT pf.id, pf.name, pf.category, pf.icon
      FROM property_features pf
      INNER JOIN property_feature_assignments pfa ON pf.id = pfa.feature_id
      WHERE pfa.property_id = $1
      ORDER BY pf.category, pf.name
    `;

    const result = await query(queryText, [propertyId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching property features:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
