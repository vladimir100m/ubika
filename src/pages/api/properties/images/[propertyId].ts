import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../utils/db';
import { resolveImageUrl } from '../../../../utils/blob';

let cachedPropIdType: 'uuid' | 'integer' | null = null;
async function detectPropertyIdType(): Promise<'uuid' | 'integer'> {
  if (cachedPropIdType) return cachedPropIdType;
  const result = await query(`SELECT data_type FROM information_schema.columns WHERE table_name='properties' AND column_name='id' LIMIT 1`);
  cachedPropIdType = result.rows[0]?.data_type === 'uuid' ? 'uuid' : 'integer';
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { propertyId } = req.query;
    
    if (!propertyId || typeof propertyId !== 'string') {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Accept numeric or UUID propertyId
    let propertyIdValue: string | number = propertyId;
    if (/^\d+$/.test(propertyId)) {
      const num = parseInt(propertyId, 10);
      if (!isNaN(num)) propertyIdValue = num; else return res.status(400).json({ error: 'Invalid numeric property ID' });
    } else if (/^[0-9a-fA-F-]{36}$/.test(propertyId)) {
      // UUID - leave as string
    } else {
      return res.status(400).json({ error: 'Invalid property ID format' });
    }
    
    // Get all images for the property (handling both numeric and UUID)
    const runSelect = async () => query(
      `SELECT id, property_id, image_url, is_cover, display_order, created_at, updated_at
       FROM property_images 
       WHERE property_id = $1 
       ORDER BY display_order ASC, created_at ASC`,
      [propertyIdValue]
    );

    let imagesResult;
    try {
      imagesResult = await runSelect();
    } catch (e: any) {
      if (e?.code === '42P01') { // table missing
        console.warn('[images:get] property_images missing – creating table');
        await ensurePropertyImagesTable();
        imagesResult = await runSelect();
      } else {
        throw e;
      }
    }

    // Attempt to resolve stored image_url values to public URLs
    const imgs = imagesResult.rows;
    for (const img of imgs) {
      try {
        img.image_url = await resolveImageUrl(img.image_url);
      } catch (e) {
        // leave original if resolution fails
      }
    }

    res.status(200).json({
      property_id: propertyIdValue,
      images: imgs,
      count: imgs.length
    });

  } catch (error: any) {
    console.error('Error fetching property images:', error);
    res.status(500).json({ 
      error: 'Failed to fetch property images', 
      code: error?.code, 
      details: process.env.NODE_ENV !== 'production' ? String(error?.message || error) : undefined 
    });
  }
};

export default handler;
