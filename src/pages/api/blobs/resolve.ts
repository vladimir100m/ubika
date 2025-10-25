import { NextApiRequest, NextApiResponse } from 'next';
import { resolveImageUrl } from '../../../lib/blob';
import loggerModule, { createRequestId, createLogger } from '../../../lib/logger';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const reqId = createRequestId('req-');
  const log = createLogger(reqId);
  log.info('blobs.resolve handler start', { method: req.method, url: req.url });

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

    const start = Date.now();
    const resolved = await resolveImageUrl(key);
    const ms = Date.now() - start;
    log.info('resolveImageUrl executed', { durationMs: ms, key });
    if (!resolved) {
      log.warn('Could not resolve key to a public URL', { key });
      return res.status(404).json({ error: 'Could not resolve key to a public URL' });
    }

    res.status(200).json({ url: resolved });
  } catch (err) {
    log.error('Error resolving blob key', err);
    res.status(500).json({ error: 'Failed to resolve blob key' });
  }
};

export default handler;
