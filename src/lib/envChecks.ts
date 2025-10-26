// src/lib/envChecks.ts
// Small server-side checks to validate critical environment variables at startup.
// Call `validateEnv()` from server entrypoints (API routes, server-side boot) to fail fast with actionable messages.

export function validateEnv(): void {
  const { MONGODB_URI, MONGODB_DB } = process.env

  if (MONGODB_URI && !MONGODB_DB) {
    // try to parse DB name from URI
    try {
      const parsed = new URL(MONGODB_URI)
      const p = parsed.pathname || ''
      if (!p || p === '/') {
        throw new Error('MONGODB_DB not set and connection string does not include a database path')
      }
    } catch (err) {
      // Re-throw a clear, actionable error
      throw new Error('MONGODB_DB is required when MONGODB_URI is set. Set MONGODB_DB in your .env.local to the target database to avoid using the default "test" database.')
    }
  }

  // Additional checks could be added here (VERCEL_REDIS_URL, VERCEL_BLOB_TOKEN, ADMIN_SECRET)
}

export default validateEnv
