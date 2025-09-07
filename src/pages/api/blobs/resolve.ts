import { NextApiRequest, NextApiResponse } from 'next';
import { resolveImageUrl } from '../../../utils/blob';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Extract key from query or body. Support array query params and JSON body.
    const rawKey = req.method === 'GET' ? req.query.key : (req.body && req.body.key);
    let key: string | undefined;
    if (Array.isArray(rawKey)) {
      key = rawKey[0];
    } else if (typeof rawKey === 'string') {
      key = rawKey;
    }

    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'key query param or body.key is required' });
    }

    const resolved = await resolveImageUrl(key);
    if (!resolved) {
      return res.status(404).json({ error: 'Could not resolve key to a public URL' });
    }

    res.status(200).json({ url: resolved });
  } catch (err) {
    console.error('Error resolving blob key:', err);
    res.status(500).json({ error: 'Failed to resolve blob key' });
  }
};

export default handler;
