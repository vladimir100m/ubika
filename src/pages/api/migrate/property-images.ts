import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/db';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create property_images table
    await query(`
      CREATE TABLE IF NOT EXISTS property_images (
          id SERIAL PRIMARY KEY,
          property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
          image_url VARCHAR(500) NOT NULL,
          is_cover BOOLEAN DEFAULT false,
          display_order INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_property_images_cover ON property_images(property_id, is_cover)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_property_images_order ON property_images(property_id, display_order)`);

    // Unique constraint for cover images
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_property_images_unique_cover 
      ON property_images(property_id) WHERE is_cover = true
    `);

    // Migrate existing data
    await query(`
      INSERT INTO property_images (property_id, image_url, is_cover, display_order)
      SELECT 
          id as property_id,
          COALESCE(image_url, 
              CASE 
                  WHEN type = 'house' THEN '/properties/casa-moderna.jpg'
                  WHEN type = 'apartment' THEN '/properties/apartamento-moderno.jpg'
                  WHEN type = 'cabin' THEN '/properties/cabana-bosque.jpg'
                  WHEN type = 'villa' THEN '/properties/villa-lujo.jpg'
                  WHEN type = 'penthouse' THEN '/properties/penthouse-lujo.jpg'
                  WHEN type = 'loft' THEN '/properties/loft-urbano.jpg'
                  WHEN type = 'duplex' THEN '/properties/duplex-moderno.jpg'
                  ELSE '/properties/casa-moderna.jpg'
              END
          ) as image_url,
          true as is_cover,
          1 as display_order
      FROM properties 
      WHERE id NOT IN (SELECT DISTINCT property_id FROM property_images)
      ON CONFLICT DO NOTHING
    `);

    // Create trigger function
    await query(`
      CREATE OR REPLACE FUNCTION update_property_images_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    // Create trigger
    await query(`
      DROP TRIGGER IF EXISTS property_images_updated_at_trigger ON property_images;
      CREATE TRIGGER property_images_updated_at_trigger
          BEFORE UPDATE ON property_images
          FOR EACH ROW
          EXECUTE FUNCTION update_property_images_updated_at()
    `);

    res.status(200).json({ message: 'Database migration completed successfully' });

  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed', details: error });
  }
};

export default handler;
