import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../lib/db';
import { cacheGet, cacheSet } from '../../lib/cache';

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

    const cacheKey = 'property-features:list';
    const defaultTtl = parseInt(process.env.PROPERTY_CONSTS_CACHE_TTL || '3600', 10);
    try {
      const cached = await cacheGet<any[]>(cacheKey);
      if (cached) return res.status(200).json(cached);
    } catch (e) {
      console.warn('Cache get failed for property-features', e);
    }

    const result = await query(queryText);
    try { await cacheSet(cacheKey, result.rows, defaultTtl); } catch (e) { console.warn('Cache set failed for property-features', e); }
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching property features:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
