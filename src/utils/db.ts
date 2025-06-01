import { Pool, PoolClient } from 'pg';

// Create a connection pool
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'admin',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'ubika',
  password: process.env.POSTGRES_PASSWORD || 'admin',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Function to get a client from the pool
export const getDbClient = async (): Promise<PoolClient> => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw new Error('Database connection failed');
  }
};

// Function to execute a query with automatic connection management
export const query = async (text: string, params?: any[]): Promise<any> => {
  const client = await getDbClient();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release(); // Return the client to the pool
  }
};

// Function to close the pool (useful for cleanup)
export const closePool = async (): Promise<void> => {
  await pool.end();
};

export default pool;
