#!/usr/bin/env node
// Dev integration runner (safe dry-run by default).
// Usage:
//  node scripts/dev_sync_integration.js --dry-run
//  node scripts/dev_sync_integration.js --live --propertyId=...  (live not implemented in this script)

const argv = require('minimist')(process.argv.slice(2))
// Load .env.local if present so the script can use local test credentials
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  // ignore if dotenv isn't available
}

const { buildAndUpsert } = require('../src/lib/syncProperty')
const { Pool } = require('pg')

async function runQuery(text, params) {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL not set in .env.local')
  }
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
  try {
    const res = await pool.query(text, params)
    return res
  } finally {
    try { await pool.end() } catch (e) { /* ignore */ }
  }
}

const query = runQuery

async function dryRun() {
  console.log('Running dry-run integration test for sync pipeline')

  const property = {
    id: argv.propertyId || 'dry-prop-1',
    title: 'Dry-run Property',
    description: 'Dry-run description',
    price: 200000,
    squareMeters: 80,
    city: 'Drytown',
    seller_id: 'seller-dry',
    operation_status_id: 1,
  }

  const images = [{ id: 'img-1', image_url: 'https://example.com/dry-1.jpg', is_cover: true }]
  const features = [{ id: 'feat-1', name: 'Pool' }, { id: 'feat-2', name: 'Balcony' }]

  // fake adapters
  let upsertCalled = false
  const fakeUpsert = async (id, doc) => {
    upsertCalled = true
    console.log('[DRY] upsertPropertyDocument called for id=', id)
    // inspect doc briefly
    console.log('[DRY] doc.summary=', doc.summary)
    return null
  }

  let cacheDeletes = []
  const fakeCacheDel = async (key) => {
    cacheDeletes.push(key)
    console.log('[DRY] cacheDel ->', key)
  }

  let invalidated = []
  const fakeCacheInvalidate = async (pattern) => {
    invalidated.push(pattern)
    console.log('[DRY] cacheInvalidatePattern ->', pattern)
  }

  const fakeResolve = async (u) => u

  // simple cache key builder used for dry-run invalidation patterns
  const CACHE_KEYS = {
    property: (id) => `v1:property:${id}`,
    properties: {
      listPattern: () => `v1:properties:list:*`,
      listByZone: (zone) => `v1:properties:list:*zone=${zone.toLowerCase()}*`,
      listByOperation: (op) => `v1:properties:list:*op=${op.toLowerCase()}*`,
    },
    seller: (sellerId) => ({ listPattern: () => `v1:seller:${sellerId}:list:*`, listByZone: (zone) => `v1:seller:${sellerId}:list:*zone=${zone.toLowerCase()}*` }),
  }

  const getPropertyInvalidationPatterns = (p) => {
    const patterns = new Set()
    patterns.add(CACHE_KEYS.properties.listPattern())
    if (p.seller_id) patterns.add(CACHE_KEYS.seller(p.seller_id).listPattern())
    if (p.city) patterns.add(CACHE_KEYS.properties.listByZone(p.city))
    if (p.city && p.seller_id) patterns.add(CACHE_KEYS.seller(p.seller_id).listByZone(p.city))
    const opStr = p.operation_status_id === 1 ? 'sale' : p.operation_status_id === 2 ? 'rent' : ''
    if (opStr) patterns.add(CACHE_KEYS.properties.listByOperation(opStr))
    return Array.from(patterns)
  }

  const res = await buildAndUpsert({
    property,
    images,
    features,
    resolveImageUrl: fakeResolve,
    upsertPropertyDocument: fakeUpsert,
    cacheDel: fakeCacheDel,
    cacheInvalidatePattern: fakeCacheInvalidate,
    CACHE_KEYS,
    getPropertyInvalidationPatterns,
    defaultCurrency: 'USD',
  })

  console.log('\nDry-run result:', res)
  console.log('Upsert called:', upsertCalled)
  console.log('Cache deletions:', cacheDeletes)
  console.log('Invalidation patterns:', invalidated)
}

async function main() {
  if (argv.live) {
    // Live mode: perform real upsert to Mongo and invalidate Redis keys.
    console.log('Running LIVE integration: will upsert to Mongo and invalidate Redis (uses .env.local)')

    const { MongoClient } = require('mongodb')
    const cache = require('./cache-wrapper')

    const mongoUri = process.env.MONGODB_URI
    const mongoDb = process.env.MONGODB_DB
    if (!mongoUri || !mongoDb) {
      console.error('MONGODB_URI or MONGODB_DB not set. Aborting live run.')
      process.exit(2)
    }

    let redis = cache.client

    let client
    try {
      client = new MongoClient(mongoUri)
      await client.connect()
    } catch (err) {
      console.error('Failed to connect to Mongo:', err)
      process.exit(3)
    }

    let propertyId = argv.propertyId
    if (!propertyId) {
      console.log('No --propertyId provided; selecting the first property from the DB for live')
      try {
        const r = await query('SELECT id FROM properties LIMIT 1', [])
        if (!r || !r.rows || r.rows.length === 0) {
          console.error('No properties found in the database to run live')
          process.exit(4)
        }
        propertyId = r.rows[0].id
        console.log('Selected propertyId:', propertyId)
      } catch (err) {
        console.error('Failed to select propertyId from DB:', err)
        process.exit(5)
      }
    }

    try {
      const propertyRes = await query(`SELECT * FROM properties WHERE id = $1`, [propertyId])
      if (!propertyRes || propertyRes.rows.length === 0) {
        console.error('Property not found in Postgres:', propertyId)
        process.exit(6)
      }
      const property = propertyRes.rows[0]

      const imagesRes = await query('SELECT id, property_id, image_url, is_cover, display_order FROM property_images WHERE property_id = $1 ORDER BY is_cover DESC, display_order ASC', [propertyId])
      const images = imagesRes.rows || []
      const featsRes = await query('SELECT f.id, f.name FROM property_features f JOIN property_feature_assignments a ON a.feature_id = f.id WHERE a.property_id = $1', [propertyId])
      const features = featsRes.rows || []

      // real upsert function using Mongo
      const upsertPropertyDocument = async (id, doc) => {
        const db = client.db(mongoDb)
        const col = db.collection('property_documents')
        const res = await col.updateOne({ property_id: id }, { $set: { property_id: id, doc, updated_at: new Date() } }, { upsert: true })
        console.log('[LIVE] upsertPropertyDocument result:', res.result || res)
        return res
      }

      // cache deletion helpers using Redis (if available)
      const cacheDel = async (key) => {
        if (!redis) return null
        try {
          const r = await cache.del(key)
          console.log('[LIVE] cache.del', key, '->', r)
          return r
        } catch (e) {
          console.warn('[LIVE] cache.del error', e && e.message)
        }
      }

      const cacheInvalidatePattern = async (pattern) => {
        if (!redis) return null
        try {
          const found = []
          const stream = cache.scanStream({ match: pattern, count: 100 })
          for await (const keys of stream) {
            if (keys && keys.length) found.push(...keys)
          }
          if (!found || found.length === 0) {
            console.log('[LIVE] scan found 0 for pattern', pattern)
            return 0
          }
          const chunkSize = 500
          let deletedTotal = 0
          for (let i = 0; i < found.length; i += chunkSize) {
            const chunk = found.slice(i, i + chunkSize)
            const r = await cache.del(...chunk)
            deletedTotal += r || 0
            console.log('[LIVE] cache.del chunk deleted', r, 'keys')
          }
          console.log('[LIVE] cache.invalidate for pattern', pattern, 'deleted total', deletedTotal, 'keys')
          return deletedTotal
        } catch (e) {
          console.warn('[LIVE] cache invalidate error', e && e.message)
        }
      }

      let CACHE_KEYS
      let getPropertyInvalidationPatterns
      try {
        const cb = require('../src/lib/cacheKeyBuilder')
        CACHE_KEYS = cb.CACHE_KEYS || cb.default || cb
        getPropertyInvalidationPatterns = cb.getPropertyInvalidationPatterns
      } catch (e) {
        // fallback same as live-dry
        CACHE_KEYS = {
          property: (id) => `v1:property:${id}`,
          properties: {
            listPattern: () => `v1:properties:list:*`,
            listByZone: (zone) => `v1:properties:list:*zone=${zone.toLowerCase()}*`,
            listByOperation: (op) => `v1:properties:list:*op=${op.toLowerCase()}*`,
          },
          seller: (sellerId) => ({ listPattern: () => `v1:seller:${sellerId}:list:*`, listByZone: (zone) => `v1:seller:${sellerId}:list:*zone=${zone.toLowerCase()}*` }),
        }
        getPropertyInvalidationPatterns = (p) => {
          const patterns = new Set()
          patterns.add(CACHE_KEYS.properties.listPattern())
          if (p.seller_id) patterns.add(CACHE_KEYS.seller(p.seller_id).listPattern())
          if (p.city) patterns.add(CACHE_KEYS.properties.listByZone(p.city))
          if (p.city && p.seller_id) patterns.add(CACHE_KEYS.seller(p.seller_id).listByZone(p.city))
          const opStr = p.operation_status_id === 1 ? 'sale' : p.operation_status_id === 2 ? 'rent' : ''
          if (opStr) patterns.add(CACHE_KEYS.properties.listByOperation(opStr))
          return Array.from(patterns)
        }
      }

      const res = await buildAndUpsert({
        property,
        images,
        features,
        resolveImageUrl: async (u) => u,
        upsertPropertyDocument,
        cacheDel,
        cacheInvalidatePattern,
        CACHE_KEYS,
        getPropertyInvalidationPatterns,
        defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
      })

      console.log('LIVE result:', res)

      // cleanup
      try {
        await client.close()
      } catch (e) {}
      try {
        if (cache.quit) await cache.quit()
      } catch (e) {}

      process.exit(0)
    } catch (err) {
      console.error('live error:', err)
      try { await client.close() } catch (e) {}
      try { if (redis) await redis.quit() } catch (e) {}
      process.exit(7)
    }
  }

  if (argv['live-dry']) {
    let propertyId = argv.propertyId
    // If no propertyId provided, auto-select the first property id from the DB
    if (!propertyId) {
      console.log('No --propertyId provided; selecting the first property from the DB for live-dry')
      try {
        const r = await query('SELECT id FROM properties LIMIT 1', [])
        if (!r || !r.rows || r.rows.length === 0) {
          console.error('No properties found in the database to run live-dry')
          process.exit(3)
        }
        propertyId = r.rows[0].id
        console.log('Selected propertyId:', propertyId)
      } catch (err) {
        console.error('Failed to select propertyId from DB:', err)
        process.exit(4)
      }
    }
    // Fetch property from Postgres using src/lib/db (reads DATABASE_URL from env)
    console.log('Running live-dry: fetching property from Postgres using DATABASE_URL in .env.local')
    try {
      const propertyRes = await query(`SELECT * FROM properties WHERE id = $1`, [propertyId])
      if (!propertyRes || propertyRes.rows.length === 0) {
        console.error('Property not found in Postgres:', propertyId)
        process.exit(3)
      }
      const property = propertyRes.rows[0]

      // Fetch images and features
      const imagesRes = await query('SELECT id, property_id, image_url, is_cover, display_order FROM property_images WHERE property_id = $1 ORDER BY is_cover DESC, display_order ASC', [propertyId])
      const images = imagesRes.rows || []
      const featsRes = await query('SELECT f.id, f.name FROM property_features f JOIN property_feature_assignments a ON a.feature_id = f.id WHERE a.property_id = $1', [propertyId])
      const features = featsRes.rows || []

      // Use the buildAndUpsert helper but stub write functions to avoid writes
      const fakeUpsert = async (id, doc) => {
        console.log('[LIVE-DRY] would upsert document for', id)
        // show a brief preview
        console.log(JSON.stringify({ id: doc.id, title: doc.title, summary: doc.summary }, null, 2))
        return null
      }
      const fakeCacheDel = async (k) => console.log('[LIVE-DRY] would delete cache key', k)
      const fakeCacheInvalidate = async (p) => console.log('[LIVE-DRY] would invalidate pattern', p)
      const fakeResolve = async (u) => u

      let CACHE_KEYS
      let getPropertyInvalidationPatterns
      try {
        const cb = require('../src/lib/cacheKeyBuilder')
        CACHE_KEYS = cb.CACHE_KEYS || cb.default || cb
        getPropertyInvalidationPatterns = cb.getPropertyInvalidationPatterns
      } catch (e) {
        // Fallback to a local simplified implementation if the module can't be required
        CACHE_KEYS = {
          property: (id) => `v1:property:${id}`,
          properties: {
            listPattern: () => `v1:properties:list:*`,
            listByZone: (zone) => `v1:properties:list:*zone=${zone.toLowerCase()}*`,
            listByOperation: (op) => `v1:properties:list:*op=${op.toLowerCase()}*`,
          },
          seller: (sellerId) => ({ listPattern: () => `v1:seller:${sellerId}:list:*`, listByZone: (zone) => `v1:seller:${sellerId}:list:*zone=${zone.toLowerCase()}*` }),
        }
        getPropertyInvalidationPatterns = (p) => {
          const patterns = new Set()
          patterns.add(CACHE_KEYS.properties.listPattern())
          if (p.seller_id) patterns.add(CACHE_KEYS.seller(p.seller_id).listPattern())
          if (p.city) patterns.add(CACHE_KEYS.properties.listByZone(p.city))
          if (p.city && p.seller_id) patterns.add(CACHE_KEYS.seller(p.seller_id).listByZone(p.city))
          const opStr = p.operation_status_id === 1 ? 'sale' : p.operation_status_id === 2 ? 'rent' : ''
          if (opStr) patterns.add(CACHE_KEYS.properties.listByOperation(opStr))
          return Array.from(patterns)
        }
      }

      const res = await buildAndUpsert({
        property,
        images,
        features,
        resolveImageUrl: fakeResolve,
        upsertPropertyDocument: fakeUpsert,
        cacheDel: fakeCacheDel,
        cacheInvalidatePattern: fakeCacheInvalidate,
        CACHE_KEYS,
        getPropertyInvalidationPatterns,
        defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
      })

      console.log('LIVE-DRY result:', res)
      process.exit(0)
    } catch (err) {
      console.error('live-dry error:', err)
      process.exit(4)
    }
  }

  await dryRun()
}

main().catch((err) => {
  console.error('dev_sync_integration error', err)
  process.exit(2)
})
