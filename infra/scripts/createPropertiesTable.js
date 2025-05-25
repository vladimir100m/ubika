import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') }); // Adjust path as necessary

const createPropertiesTable = async () => {
  const client = new Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: String(process.env.POSTGRES_PASSWORD), // Explicitly cast to string
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  });

  try {
    await client.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        price TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        country TEXT NOT NULL,
        zip_code TEXT,
        type TEXT NOT NULL,
        room INTEGER NOT NULL,
        bathrooms INTEGER NOT NULL,
        area INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        status TEXT NOT NULL,
        year_built INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const constraintExists = await client.query(`
      SELECT 1 FROM pg_constraint WHERE conname = 'unique_address';
    `);

    if (constraintExists.rowCount === 0) {
      await client.query(`
        ALTER TABLE properties
        ADD CONSTRAINT unique_address UNIQUE (address);
      `);
    }

    await client.query(`
      ALTER TABLE properties
      ADD COLUMN IF NOT EXISTS geocode JSON;
    `);

    await client.query(`
      ALTER TABLE properties
      ADD COLUMN IF NOT EXISTS year_built INTEGER;
    `);

    console.log('Table "properties" created successfully!');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await client.end();
  }
};

createPropertiesTable();