import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { query } from '../../../../utils/db';

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface PropertyImageData {
  id?: number;
  property_id: number;
  image_url: string;
  is_cover: boolean;
  display_order: number;
}

// Ensure property_images table exists (lightweight idempotent)
let cachedPropIdType: 'uuid' | 'integer' | null = null;
async function detectPropertyIdType(): Promise<'uuid' | 'integer'> {
  if (cachedPropIdType) return cachedPropIdType;
  const result = await query(
    `SELECT data_type FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'id' LIMIT 1`
  );
  const dt = result.rows[0]?.data_type;
  if (dt === 'uuid') {
    cachedPropIdType = 'uuid';
  } else {
    cachedPropIdType = 'integer';
  }
  return cachedPropIdType;
}

async function ensurePropertyImagesTable() {
  const idType = await detectPropertyIdType();
  const fkType = idType === 'uuid' ? 'UUID' : 'INTEGER';
  await query(`
    CREATE TABLE IF NOT EXISTS property_images (
      id SERIAL PRIMARY KEY,
      property_id ${fkType} NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      image_url VARCHAR(500) NOT NULL,
      is_cover BOOLEAN DEFAULT false,
      display_order INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
    CREATE INDEX IF NOT EXISTS idx_property_images_cover ON property_images(property_id, is_cover);
    CREATE INDEX IF NOT EXISTS idx_property_images_order ON property_images(property_id, display_order);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_property_images_unique_cover 
      ON property_images(property_id) WHERE is_cover = true;
  `);
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const attempt = async () => {
    const form = new IncomingForm({
      uploadDir: path.join(process.cwd(), 'public/uploads'),
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      multiples: true,
    });

    // Ensure base upload directory exists
    const baseUploadDir = path.join(process.cwd(), 'public/uploads');
    try {
      await fs.access(baseUploadDir);
    } catch {
      await fs.mkdir(baseUploadDir, { recursive: true });
    }

    // Parse the form data
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err: any, fields: any, files: any) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });
    
    // property_id extraction (supports integer or uuid)
    const rawPropField = fields.property_id;
    const rawPropValue = Array.isArray(rawPropField) ? rawPropField[0] : rawPropField;
    if (!rawPropValue || (typeof rawPropValue !== 'string' && typeof rawPropValue !== 'number')) {
      return res.status(400).json({ error: 'property_id is required' });
    }
    
    // seller_id extraction (for unique path structure)
    const rawSellerField = fields.seller_id;
    const rawSellerValue = Array.isArray(rawSellerField) ? rawSellerField[0] : rawSellerField;
    const sellerId = rawSellerValue || 'anonymous';
    
    const trimmedProp = String(rawPropValue).trim();
    if (!trimmedProp || trimmedProp === 'undefined' || trimmedProp === 'null') {
      return res.status(400).json({ error: 'Invalid property_id value' });
    }
    let propertyIdValue: string | number = trimmedProp;
    if (/^\d+$/.test(trimmedProp)) {
      const num = parseInt(trimmedProp, 10);
      if (!isNaN(num)) propertyIdValue = num;
    } else if (/^[0-9a-fA-F-]{36}$/.test(trimmedProp)) {
      // UUID format - leave as string
    } else {
      // Accept string (fallback) but warn
      console.warn('Unrecognized property_id format, treating as string:', trimmedProp);
    }

    // Create unique folder structure: uploads/users/{sellerId}/properties/{propertyId}/YYYY-MM-DD/
    const now = new Date();
    const dateFolder = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const uniqueUploadPath = path.join('users', String(sellerId), 'properties', String(propertyIdValue), dateFolder);
    const fullUploadDir = path.join(baseUploadDir, uniqueUploadPath);
    
    // Create the unique directory structure
    try {
      await fs.mkdir(fullUploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
      return res.status(500).json({ error: 'Failed to create upload directory' });
    }

    // Handle both single and multiple files
    const fileArray = Array.isArray(files.images) ? files.images : [files.images].filter(Boolean);
    
    if (fileArray.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const uploadedImages: PropertyImageData[] = [];

    // Optional: verify property exists (avoid foreign key error noise)
    try {
      const propCheck = await query('SELECT id FROM properties WHERE id = $1 LIMIT 1', [propertyIdValue]);
      if (propCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Property not found' });
      }
    } catch (e) {
      // If properties table temporarily unavailable let it fail naturally later
    }

    // Get current max display_order for this property
    const maxOrderResult = await query(
      'SELECT COALESCE(MAX(display_order), 0) as max_order FROM property_images WHERE property_id = $1',
      [propertyIdValue]
    );
    let nextOrder = (maxOrderResult.rows[0]?.max_order || 0) + 1;

    for (const file of fileArray) {
      if (!file || !file.filepath) continue;

      // Validate file type
      if (!file.mimetype?.startsWith('image/')) {
        await fs.unlink(file.filepath); // Clean up invalid file
        continue;
      }

      // Generate unique filename with timestamp and random string
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const extension = path.extname(file.originalFilename || '.jpg');
      const filename = `property_${propertyIdValue}_${timestamp}_${randomStr}${extension}`;
      const finalPath = path.join(fullUploadDir, filename);

      // Move file to final location
      await fs.rename(file.filepath, finalPath);

      // Store relative path for database (including the unique path structure)
      const imageUrl = `/uploads/${uniqueUploadPath}/${filename}`;

      // Insert into database
      let insertResult;
      try {
        insertResult = await query(
          `INSERT INTO property_images (property_id, image_url, is_cover, display_order, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           RETURNING id, property_id, image_url, is_cover, display_order`,
          [propertyIdValue, imageUrl, false, nextOrder]
        );
      } catch (e: any) {
        // Capture specific DB errors for better diagnostics
        if (e?.code === '23503') { // foreign key violation
          return res.status(404).json({ error: 'Property not found (foreign key violation)' });
        }
        if (e?.code === '42P01') { // missing table
          throw e; // handled by outer catch with auto-migration
        }
        if (e?.code === '23505') { // unique violation (unlikely here)
          return res.status(409).json({ error: 'Duplicate image constraint', details: e.detail });
        }
        console.error('Insert error property_images:', e);
        return res.status(500).json({ error: 'Failed to store image record', details: process.env.NODE_ENV !== 'production' ? e.message : undefined });
      }

      if (insertResult.rows[0]) {
        uploadedImages.push(insertResult.rows[0]);
      }

      nextOrder++;
    }

    // If this is the first image for the property, set it as cover
    if (uploadedImages.length > 0) {
      try {
        const coverCheckResult = await query(
          'SELECT COUNT(*) as count FROM property_images WHERE property_id = $1 AND is_cover = true',
          [propertyIdValue]
        );
        if (coverCheckResult.rows[0]?.count === '0') {
          await query(
            'UPDATE property_images SET is_cover = true WHERE id = $1',
            [uploadedImages[0].id]
          );
          if (uploadedImages[0].id) {
            uploadedImages[0].is_cover = true;
          }
        }
      } catch (e) {
        console.warn('Cover assignment skipped:', e);
      }
    }

    return res.status(200).json({
      message: 'Images uploaded successfully',
      images: uploadedImages,
      count: uploadedImages.length,
      uploadPath: uniqueUploadPath
    });
  };

  try {
    await attempt();
  } catch (error) {
    // Auto-create table if missing, then retry once
    const pgError: any = error;
    const code = pgError?.code; // Postgres error code
    const message = pgError?.message || '';
    if (code === '42P01' || /property_images/i.test(message) && /does not exist|undefined/i.test(message)) {
      try {
        console.warn('[upload] property_images table missing. Creating…');
        await ensurePropertyImagesTable();
        await attempt();
        return;
      } catch (retryErr) {
        console.error('Retry after auto-migration failed:', retryErr);
        return res.status(500).json({ error: 'Failed to upload images after auto-migration', details: process.env.NODE_ENV !== 'production' ? String(retryErr) : undefined });
      }
    }
    console.error('Error uploading images:', error);
    res.status(500).json({ 
      error: 'Failed to upload images', 
      details: process.env.NODE_ENV !== 'production' ? String(error) : undefined 
    });
  }
};

export default handler;
