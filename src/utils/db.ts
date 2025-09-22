import pkg from 'pg';
const { Pool } = pkg;
import type { PoolClient } from 'pg';
import loggerModule, { createRequestId, createLogger } from './logger';

const logger = loggerModule;

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
  logger.info('Database pool created', { max: 20 });
} else {
  logger.warn('DATABASE_URL not set — database features will be disabled for local development.');
}

// Function to get a client from the pool
export const getDbClient = async (): Promise<PoolClient> => {
  if (!pool) {
    // Return a lightweight mock client that provides the minimal API used by
    // the rest of the app: `query()` and `release()`.
    logger.debug('getDbClient: returning mock client (no pool)');
    return {
      query: async (_text: string, _params?: any[]) => ({ rows: [] }),
      release: () => {},
    } as unknown as PoolClient;
  }

  try {
    const client = await pool.connect();
    logger.debug('getDbClient: acquired client from pool');
    return client;
  } catch (error) {
    logger.error('Error connecting to database:', error);
    throw new Error('Database connection failed');
  }
};

// Function to execute a query with automatic connection management
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  const client = await getDbClient();
  try {
    logger.debug('DB query start', { text: text.replace(/\s+/g, ' ').trim(), params });
    const result = await client.query(text, params);
    const ms = Date.now() - start;
    logger.info('DB query completed', { durationMs: ms, rows: result?.rowCount || 0 });
    return result;
  } catch (error) {
    logger.error('Database query error', { error, text, params });
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
    const start = Date.now();
    await client.query('SELECT 1');
    client.release();
    const ms = Date.now() - start;
    logger.info('Database connection successful', { durationMs: ms });
    return true;
  } catch (error) {
    logger.error('Database connection failed', error);
    return false;
  }
};

// Function to handle transactions
export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getDbClient();
  const reqId = createRequestId('tx-');
  const log = createLogger(reqId);
  log.debug('withTransaction: start');
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    log.debug('withTransaction: committed');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    log.error('withTransaction: rolled back', error);
    throw error;
  } finally {
    client.release();
    log.debug('withTransaction: client released');
  }
};

export default pool;
