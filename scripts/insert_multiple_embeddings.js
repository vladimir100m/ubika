#!/usr/bin/env node
// Insert multiple sample embedding documents into `property_embeddings`.
// Usage:
//   VECTOR_DIM=1536 COUNT=10 node scripts/insert_multiple_embeddings.js

const { MongoClient } = require('mongodb');

function randVector(dim, seed = 0) {
  // simple pseudo-random deterministic generator from seed
  const vec = new Array(dim);
  let x = seed || Date.now();
  for (let i = 0; i < dim; i++) {
    x = (x * 1664525 + 1013904223) & 0xffffffff;
    vec[i] = ((x >>> 0) % 1000) / 1000; // [0,1)
  }
  return vec;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'ubika';
  const dim = Number(process.env.VECTOR_DIM || 1536);
  const count = Number(process.env.COUNT || 10);
  if (!uri) {
    console.error('MONGODB_URI not set. Source .env.local or set env var.');
    process.exit(2);
  }

  console.log(`Connecting to ${dbName} and inserting ${count} docs (dim=${dim})...`);
  const client = new MongoClient(uri, { maxPoolSize: 4 });
  try {
    await client.connect();
    const db = client.db(dbName);
    const coll = db.collection('property_embeddings');

    const docs = [];
    for (let i = 0; i < count; i++) {
      docs.push({
        propertyId: `sample-${i + 1}`,
        content: `Sample embedding ${i + 1}`,
        chunkIndex: 0,
        embedding: randVector(dim, i + 1),
        createdAt: new Date(),
      });
    }

    const res = await coll.insertMany(docs, { ordered: false });
    console.log('Inserted count:', Object.keys(res.insertedIds).length);
  } catch (err) {
    console.error('Error inserting multiple embeddings:', err && err.message ? err.message : err);
    process.exitCode = 3;
  } finally {
    try { await client.close(); } catch (_) {}
  }
}

main();
