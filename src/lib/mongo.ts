import { MongoClient, Db } from 'mongodb'
import { validateEnv } from './envChecks'

// Run quick env checks at module load to fail fast in server contexts when critical envs are missing.
try {
  validateEnv()
} catch (err) {
  // Re-throwing would make importing this module crash during e.g. static analysis in some tools.
  // Instead, surface a clear message and rethrow so server processes fail fast.
  console.error('Environment validation failed:', err && (err as Error).message)
  throw err
}

declare global {
  // allow global to store the mongo client in dev to avoid reconnects
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined
}

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB // required to avoid using Mongo default 'test' DB

if (!uri) {
  // Not throwing here to allow the app to run in environments without Mongo configured.
  // Functions that need Mongo will surface errors when attempting to use it.
  console.warn('MONGODB_URI not set — Mongo read-model disabled')
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!uri) throw new Error('MONGODB_URI is not configured')

  if (global.__mongoClientPromise) {
    return global.__mongoClientPromise
  }

  const client = new MongoClient(uri)
  // Connect immediately and cache the promise on global to reuse in serverless
  global.__mongoClientPromise = client.connect()
  return global.__mongoClientPromise
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient()
  // To avoid accidentally using Mongo's default 'test' database, require an explicit DB name
  if (!dbName) {
    // If URI is missing (shouldn't happen because getMongoClient throws) fail fast
    if (!uri) throw new Error('MONGODB_URI is not configured')

    // Try to detect a database in the connection string path
    try {
      const parsed = new URL(uri)
      const path = parsed.pathname || ''
      if (path && path !== '/') {
        const maybeDb = path.replace(/^\//, '')
        if (maybeDb) return client.db(maybeDb)
      }
    } catch (err) {
      // ignore URL parse errors and fallthrough to required check
    }

    throw new Error('MONGODB_DB is not set. Set MONGODB_DB to avoid using the default "test" database.')
  }

  return client.db(dbName)
}

export async function closeMongoClient(): Promise<void> {
  if (global.__mongoClientPromise) {
    try {
      const client = await global.__mongoClientPromise
      await client.close()
    } finally {
      global.__mongoClientPromise = undefined
    }
  }
}

export default getDb
