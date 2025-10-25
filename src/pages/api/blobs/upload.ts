import type { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import { IncomingForm } from 'formidable';
import * as fs from 'fs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm();
    const [fields, files] = await form.parse(req);

    const fileArray = Array.isArray(files.file) ? files.file : files.file ? [files.file] : [];

    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = fileArray[0];
    const fileStream = fs.createReadStream(file.filepath);

    // Upload to Vercel Blob
    const blob = await put(file.originalFilename || 'image', fileStream, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log('📤 File uploaded to blob storage:', blob.url);

    return res.status(200).json({
      url: blob.url,
      publicUrl: blob.url,
      pathname: blob.pathname,
      contentType: file.mimetype,
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: String(error) });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
