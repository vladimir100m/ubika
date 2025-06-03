import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const listProperties = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    const query = 'SELECT * FROM properties';
    const result = await client.query(query);

    console.log('Properties:', result.rows);
  } catch (error) {
    console.error('Error listing properties:', error);
  } finally {
    await client.end();
  }
};

listProperties();
