import type { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import { IncomingForm } from 'formidable';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const QUALITY_VARIANTS = {
  thumbnail: { width: 300, height: 200, quality: 80 },
  medium: { width: 800, height: 600, quality: 85 },
  original: { quality: 90 }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm({
      maxFileSize: MAX_FILE_SIZE,
      filter: (part) => {
        return !!(part.mimetype && ALLOWED_TYPES.includes(part.mimetype));
      }
    });

    const [fields, files] = await form.parse(req);

    // Extract metadata
    const propertyId = Array.isArray(fields.propertyId) ? fields.propertyId[0] : fields.propertyId;
    const bucket = Array.isArray(fields.bucket) ? fields.bucket[0] : fields.bucket || 'property-images';
    
    const fileArray = Array.isArray(files.file) ? files.file : files.file ? [files.file] : [];

    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = fileArray[0];
    
    // Validate file type
    if (!file.mimetype || !ALLOWED_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type', 
        allowed: ALLOWED_TYPES 
      });
    }

    // Generate unique filename with proper structure
    const fileExtension = path.extname(file.originalFilename || '').toLowerCase() || '.jpg';
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    
    // Organized blob path structure
    const blobPath = propertyId 
      ? `properties/${propertyId}/${timestamp}-${uniqueId}${fileExtension}`
      : `uploads/${timestamp}-${uniqueId}${fileExtension}`;

    const fileStream = fs.createReadStream(file.filepath);

    // Upload to Vercel Blob with structured naming
    const blob = await put(blobPath, fileStream, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false, // We handle uniqueness ourselves
    });

    console.log('📤 File uploaded to blob storage:', {
      url: blob.url,
      path: blobPath,
      size: file.size,
      type: file.mimetype
    });

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      url: blob.url,
      publicUrl: blob.url,
      pathname: blob.pathname,
      contentType: file.mimetype,
      size: file.size,
      filename: file.originalFilename,
      blobPath: blobPath,
      uploadedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Handle specific error types
    if (error.message?.includes('File too large')) {
      return res.status(413).json({ error: 'File too large', maxSize: MAX_FILE_SIZE });
    }
    
    if (error.message?.includes('Invalid file type')) {
      return res.status(400).json({ error: 'Invalid file type', allowed: ALLOWED_TYPES });
    }
    
    return res.status(500).json({ 
      error: 'Upload failed', 
      details: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error'
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
