#!/usr/bin/env node
// Seed a single denormalized property document into the Mongo read-model
// and invalidate property list cache so the running server picks it up.

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const { MongoClient } = require('mongodb')

async function main() {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB
  if (!uri || !dbName) {
    console.error('MONGODB_URI and MONGODB_DB must be set in .env.local')
    process.exit(1)
  }

  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db(dbName)
    const col = db.collection('property_documents')

    const propertyId = process.argv[2] || 'seed-prop-1'
    const doc = {
      id: propertyId,
      title: 'Seeded Property',
      description: 'This is a seeded property for preview smoke tests.',
      summary: 'Seeded 2br apartment',
      price: 123000,
      neighborhood: { city: 'Seedville', name: 'Central' },
      seller_id: 'seed-seller',
      images: [{ id: 'img-seed-1', url: 'https://example.com/seed.jpg', is_cover: true }],
      created_at: new Date(),
      updated_at: new Date(),
    }

    const res = await col.updateOne(
      { property_id: propertyId },
      { $set: { property_id: propertyId, doc, updated_at: new Date() } },
      { upsert: true }
    )
    console.log('Upsert result:', res.result || res)

    // Invalidate cache pattern using script shim
    try {
      const cache = require('./cache-wrapper')
      console.log('Invalidating cache pattern v1:properties:list:*')
      await cache.invalidatePattern('v1:properties:list:*')
      if (cache.quit) await cache.quit()
    } catch (e) {
      console.warn('Cache invalidation failed:', e && e.message)
    }

    console.log('Seed complete. propertyId=', propertyId)
  } catch (err) {
    console.error('Error seeding read-model:', err && err.message)
    process.exit(2)
  } finally {
    try { await client.close() } catch (e) {}
  }
}

main()
