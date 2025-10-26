#!/usr/bin/env node
/*
 scripts/verify_db.js
 Quick verification helper that prints row counts for key Postgres tables
 and document counts for the Mongo read-model collection.

 Usage:
  node scripts/verify_db.js

 It reads env from .env.local if present.
*/

const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })

const { Client } = require('pg')
const { MongoClient } = require('mongodb')

async function countPostgres() {
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    console.warn('DATABASE_URL not set; skipping Postgres verification')
    return
  }

  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()
  try {
    const tables = [
      'property_feature_assignments',
      'property_features',
      'property_images',
      'properties'
    ]
    console.log('\nPostgres counts:')
    for (const t of tables) {
      try {
        const res = await client.query(`SELECT COUNT(*)::int AS cnt FROM ${t}`)
        console.log(`  ${t}: ${res.rows[0].cnt}`)
      } catch (e) {
        console.log(`  ${t}: (error or table missing) - ${e.message}`)
      }
    }
  } finally {
    await client.end()
  }
}

async function countMongo() {
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not set; skipping Mongo verification')
    return
  }

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  try {
    const envDb = process.env.MONGODB_DB
    let uriDb
    try {
      const parsed = new URL(MONGODB_URI)
      const p = parsed.pathname || ''
      if (p && p !== '/') uriDb = p.replace(/^\//, '')
    } catch (e) {}
    const dbName = envDb || uriDb
    if (!dbName) {
      console.warn('MONGODB_DB not set and could not be inferred; skipping Mongo verification')
      return
    }
    const db = client.db(dbName)
    const col = db.collection('property_documents')
    const cnt = await col.countDocuments()
    console.log('\nMongo counts:')
    console.log(`  ${dbName}.property_documents: ${cnt}`)
  } finally {
    await client.close()
  }
}

(async function main() {
  try {
    await countPostgres()
    await countMongo()
    process.exit(0)
  } catch (err) {
    console.error('verify_db error:', err && err.message)
    process.exit(1)
  }
})()
