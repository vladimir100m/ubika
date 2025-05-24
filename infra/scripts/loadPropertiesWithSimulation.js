import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadPropertiesWithSimulation = async () => {
  const client = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'ubika',
    password: 'admin',
    port: 5432,
  });

  try {
    await client.connect();

    const filePath = path.join(__dirname, '../properties.json');
    const properties = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const property of properties) {
      const title = property.title || `Property at ${property.address?.split(',')[0] || 'Unknown Location'}`;
      const description = property.description || 'No description available';
      const price = property.price || 'Unknown';
      const address = property.address || 'Unknown address';
      const city = property.city || 'Unknown city';
      const state = property.state || 'Unknown state';
      const country = property.country || 'Unknown country';
      const zip_code = property.zip_code || null;
      const type = property.type || 'Unknown type';
      const room = property.rooms || null;
      const bathrooms = property.bathrooms || null;
      const area = property.squareMeters || null;
      const image_url = property.imageUrl || '/properties/default-placeholder.jpg';
      const status = property.status || 'available';
      const created_at = new Date().toISOString();
      const updated_at = new Date().toISOString();

      await client.query(
        `INSERT INTO properties (title, description, price, address, city, state, country, zip_code, type, room, bathrooms, area, image_url, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (address) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           price = EXCLUDED.price,
           city = EXCLUDED.city,
           state = EXCLUDED.state,
           country = EXCLUDED.country,
           zip_code = EXCLUDED.zip_code,
           type = EXCLUDED.type,
           room = EXCLUDED.room,
           bathrooms = EXCLUDED.bathrooms,
           area = EXCLUDED.area,
           image_url = EXCLUDED.image_url,
           status = EXCLUDED.status,
           updated_at = EXCLUDED.updated_at;`,
        [
          title,
          description,
          price,
          address,
          city,
          state,
          country,
          zip_code,
          type,
          room,
          bathrooms,
          area,
          image_url,
          status,
          created_at,
          updated_at
        ]
      );
    }

    console.log('Properties loaded successfully with simulated fields!');
  } catch (error) {
    console.error('Error loading properties:', error);
  } finally {
    await client.end();
  }
};

loadPropertiesWithSimulation();