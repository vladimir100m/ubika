import pkg from 'pg';
const { Pool } = pkg;
import type { PoolClient } from 'pg';

// If DATABASE_URL isn't provided, run in a safe 'no-db' mode where query
// calls return empty rows. This avoids throwing errors during local dev when
// the database is not configured.
const hasDatabase = Boolean(process.env.DATABASE_URL);
let pool: any = null;
if (hasDatabase) {
  // Create a connection pool using Neon database
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }, // Enable SSL for cloud databases like Neon
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Increased timeout for serverless environments
  });
} else {
  console.warn('DATABASE_URL not set — database features will be disabled for local development.');
}

// Function to get a client from the pool
export const getDbClient = async (): Promise<PoolClient> => {
  if (!pool) {
    // Return a lightweight mock client that provides the minimal API used by
    // the rest of the app: `query()` and `release()`.
    return {
      query: async (_text: string, _params?: any[]) => ({ rows: [] }),
      release: () => {},
    } as unknown as PoolClient;
  }

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
    try { client.release(); } catch (e) { /* noop for mock client */ }
  }
};

// (Legacy helpers for square_meters detection removed after schema unification)


// Function to close the pool (useful for cleanup)
export const closePool = async (): Promise<void> => {
  if (pool) await pool.end();
};

// Function to test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await getDbClient();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Function to handle transactions
export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getDbClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
