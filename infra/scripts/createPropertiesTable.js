import { Client } from 'pg';

const createPropertiesTable = async () => {
  const client = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'ubika',
    password: 'admin',
    port: 5432,
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

    console.log('Table "properties" created successfully!');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await client.end();
  }
};

createPropertiesTable();