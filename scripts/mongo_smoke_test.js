#!/usr/bin/env node
/*
  Simple MongoDB Atlas connectivity & vector-search smoke test.
  Reads MONGODB_URI and MONGODB_DB from environment.
  Usage (from repo root):
    MONGODB_URI="..." node scripts/mongo_smoke_test.js
*/

const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'ubika';
  if (!uri) {
    console.error('MONGODB_URI is not set. Set it in environment or .env.local');
    process.exit(2);
  }

  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri, { maxPoolSize: 4 });
  try {
    await client.connect();
    const adminDb = client.db().admin();
    const serverStatus = await adminDb.ping();
    console.log('Ping status:', serverStatus);

    const db = client.db(dbName);
    const cols = await db.listCollections().toArray();
    console.log('Collections in', dbName, ':', cols.map(c => c.name));

    const collName = 'property_embeddings';
    const coll = db.collection(collName);
    const exists = cols.some(c => c.name === collName);
    console.log(`Collection '${collName}' exists:`, exists);

    // Try a vector-search aggregate (knnBeta then knn). Use a small vector of zeros; Atlas may reject if dimension mismatch.
    const dim = Number(process.env.VECTOR_DIM || 1536);
    const testVector = new Array(Math.min(dim, 16)).fill(0); // small test vector

    try {
      console.log('Attempting $search knnBeta (if available)...');
      const pipeline = [
        { $search: { knnBeta: { vector: testVector, path: 'embedding', k: 1 } } },
        { $limit: 1 },
      ];
      const rows = await coll.aggregate(pipeline).toArray();
      console.log('knnBeta returned rows:', rows.length);
    } catch (e) {
      console.warn('knnBeta failed:', e.message);
      try {
        console.log('Attempting $search knn (fallback)...');
        const pipeline2 = [
          { $search: { knn: { vector: testVector, path: 'embedding', k: 1 } } },
          { $limit: 1 },
        ];
        const rows2 = await coll.aggregate(pipeline2).toArray();
        console.log('knn returned rows:', rows2.length);
      } catch (e2) {
        console.warn('knn fallback failed:', e2.message);
      }
    }

    console.log('Smoke test completed.');
  } catch (err) {
    console.error('Error during MongoDB smoke test:', err && err.message ? err.message : err);
    process.exitCode = 3;
  } finally {
    try { await client.close(); } catch (_) {}
  }
}

main();
