import { Client } from 'pg';
import fs from 'fs';

const properties = JSON.parse(fs.readFileSync('./infra/properties.json', 'utf-8'));

const setupDatabase = async () => {
  const client = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'ubika',
    password: 'admin',
    port: 5432,
  });

  try {
    await client.connect();

    // Step 1: Create the properties table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        title TEXT,
        description TEXT,
        price TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        zip_code TEXT,
        type TEXT,
        room INT,
        bathrooms INT,
        area INT,
        image_url TEXT,
        status TEXT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        geocode JSON,
        year_built INT,
        seller_id TEXT DEFAULT 'seller123'
      );
    `;
    await client.query(createTableQuery);
    console.log('Table created successfully.');

    // Step 2: Load properties into the table
    const insertQuery = `
      INSERT INTO properties (
        title, description, price, address, city, state, country, zip_code, type, room, bathrooms, area, image_url, status, created_at, updated_at, geocode, year_built, seller_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
      ON CONFLICT DO NOTHING;
    `;

    for (const property of properties) {
      const values = [
        property.title,
        property.description,
        property.price,
        property.address,
        property.city || 'Unknown city',
        property.state || 'Unknown state',
        property.country || 'Unknown country',
        property.zip_code || null,
        property.type || 'Unknown type',
        property.room,
        property.bathrooms,
        property.area,
        property.imageUrl,
        property.status || 'available',
        property.created_at || new Date(),
        property.updated_at || new Date(),
        property.geocode || { lat: 0, lng: 0 },
        property.year_built || null,
        'seller123',
      ];
      await client.query(insertQuery, values);
    }
    console.log('Properties loaded successfully.');

    // Step 3: Add seller_id column if it doesn't exist
    const addColumnQuery = `
      ALTER TABLE properties
      ADD COLUMN IF NOT EXISTS seller_id TEXT DEFAULT 'seller123';
    `;
    await client.query(addColumnQuery);
    console.log('seller_id column added successfully.');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await client.end();
  }
};

setupDatabase();
