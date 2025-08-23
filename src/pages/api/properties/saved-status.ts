// Saved properties feature removed.
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({ error: 'Saved properties feature has been removed.' });
}
