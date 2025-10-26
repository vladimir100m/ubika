#!/usr/bin/env node
/*
 scripts/db_clean.js
 A single, safe helper to clear test/dev fixtures from Postgres and/or MongoDB.

 Usage:
  - node scripts/db_clean.js --dry-run              # show planned actions
  - node scripts/db_clean.js --confirm --only=pg    # actually run Postgres cleanup
  - node scripts/db_clean.js --confirm --only=mongo # actually run Mongo cleanup
  - node scripts/db_clean.js --confirm --only=all   # run both

 Safety:
  - Requires either --confirm CLI flag or environment variable SAFE_TO_RUN=true
  - Loads environment from `.env.local` if present (do NOT commit secrets)

 Notes:
  - Mongo cleanup refuses to run without an explicit MONGODB_DB to avoid touching the
    default "test" database.
*/

const path = require('path')
const { Client } = require('pg')
const { MongoClient } = require('mongodb')

// Load .env.local if present so the script behaves similarly to dev runs
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })

const argv = require('minimist')(process.argv.slice(2))
const dryRun = !!argv['dry-run']
const confirm = !!argv.confirm
const onlyArg = argv.only || 'all'
const tablesArg = argv.tables // comma-separated table list for Postgres
const SAFE_TO_RUN = process.env.SAFE_TO_RUN === 'true'

if (!confirm && !SAFE_TO_RUN && !dryRun) {
  console.error('\nSafety check failed: please pass --confirm or set SAFE_TO_RUN=true (or use --dry-run)\n')
  process.exit(2)
}

const only = ('' + onlyArg).toLowerCase()
const doPg = only === 'pg' || only === 'all'
const doMongo = only === 'mongo' || only === 'all'

const defaultPgTables = [
  'property_feature_assignments',
  'property_features',
  'property_images',
  'properties'
]
const pgTables = tablesArg ? ('' + tablesArg).split(',').map(s => s.trim()).filter(Boolean) : defaultPgTables

async function clearPostgres() {
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    console.warn('DATABASE_URL not set; skipping Postgres cleanup')
    return
  }

  if (dryRun) {
    console.log('[dry-run] Postgres actions:')
    pgTables.forEach(t => console.log(`  TRUNCATE TABLE ${t} RESTART IDENTITY CASCADE;`))
    return
  }

  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()
  try {
    console.log('Connected to Postgres; running truncates...')
    for (const t of pgTables) {
      console.log(`  truncating ${t} ...`) // not overly verbose
      await client.query(`TRUNCATE TABLE ${t} RESTART IDENTITY CASCADE;`)
      console.log(`  OK: ${t}`)
    }
  } finally {
    await client.end()
  }
}

async function clearMongo() {
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not set; skipping Mongo cleanup')
    return
  }

  // Ensure we never operate on the default 'test' DB by requiring MONGODB_DB
  const envDb = process.env.MONGODB_DB
  let uriDb
  try {
    const parsed = new URL(MONGODB_URI)
    const p = parsed.pathname || ''
    if (p && p !== '/') uriDb = p.replace(/^\//, '')
  } catch (e) {
    // ignore
  }

  const dbName = envDb || uriDb
  if (!dbName) {
    console.error('\nRefusing to operate on MongoDB without an explicit database name.')
    console.error('Set MONGODB_DB in your `.env.local` to the target database to avoid using the default "test" database.')
    process.exit(3)
  }

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  try {
    const db = client.db(dbName)
    const colName = 'property_documents'

    if (dryRun) {
      console.log('[dry-run] Mongo actions:')
      console.log(`  deleteMany({}) on ${db.databaseName}.${colName}`)
      return
    }

    console.log(`Connected to MongoDB ${db.databaseName}; clearing ${colName}...`)
    const col = db.collection(colName)
    const res = await col.deleteMany({})
    console.log(`Deleted ${res.deletedCount} documents from ${db.databaseName}.${colName}`)
  } finally {
    await client.close()
  }
}

;(async function main() {
  console.log('db_clean: starting (dryRun=%s) ...', dryRun)
  try {
    if (doPg) await clearPostgres()
    if (doMongo) await clearMongo()
    console.log('db_clean: finished')
    process.exit(0)
  } catch (err) {
    console.error('db_clean: error', err && err.message)
    process.exit(1)
  }
})()
