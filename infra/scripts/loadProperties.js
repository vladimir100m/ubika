import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadProperties = async () => {
  const client = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'ubika',
    password: 'admin',
    port: 5432,
  });

  try {
    await client.connect();

    // Create database and table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        imageUrl TEXT NOT NULL,
        description TEXT NOT NULL,
        price TEXT NOT NULL,
        address TEXT NOT NULL,
        rooms INTEGER NOT NULL,
        bathrooms INTEGER NOT NULL,
        squareMeters INTEGER NOT NULL,
        yearBuilt INTEGER NOT NULL
      );
    `);

    // Read properties.json
    const filePath = path.join(__dirname, '../properties.json');
    const properties = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Insert properties into the table
    for (const property of properties) {
      await client.query(
        `INSERT INTO properties (imageUrl, description, price, address, rooms, bathrooms, squareMeters, yearBuilt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          property.imageUrl,
          property.description,
          property.price,
          property.address,
          property.rooms,
          property.bathrooms,
          property.squareMeters,
          property.yearBuilt,
        ]
      );
    }

    console.log('Properties loaded successfully!');
  } catch (error) {
    console.error('Error loading properties:', error);
  } finally {
    await client.end();
  }
};

loadProperties();