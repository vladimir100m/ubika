import { Client } from 'pg';

const listProperties = async () => {
  const client = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'ubika',
    password: 'admin',
    port: 5432,
  });

  try {
    await client.connect();

    const res = await client.query('SELECT * FROM properties');
    console.log('Properties:', res.rows);
  } catch (error) {
    console.error('Error listing properties:', error);
  } finally {
    await client.end();
  }
};

listProperties();