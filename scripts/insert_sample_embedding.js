#!/usr/bin/env node
// Insert a sample embedding document into the `property_embeddings` collection.
// Reads MONGODB_URI and MONGODB_DB from environment. Set VECTOR_DIM to match your index (default 1536).

const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'ubika';
  const dim = Number(process.env.VECTOR_DIM || 1536);
  if (!uri) {
    console.error('MONGODB_URI not set in environment. Source .env.local or set MONGODB_URI');
    process.exit(2);
  }

  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri, { maxPoolSize: 4 });
  try {
    await client.connect();
    const db = client.db(dbName);
    const coll = db.collection('property_embeddings');

    // Create a vector of zeros with the configured dimension.
    const vec = new Array(dim).fill(0);

    const doc = {
      propertyId: 'sample-1',
      content: 'Sample embedding document inserted by scripts/insert_sample_embedding.js',
      chunkIndex: 0,
      embedding: vec,
      createdAt: new Date(),
    };

    const res = await coll.insertOne(doc);
    console.log('Inserted sample document with _id =', res.insertedId);
  } catch (err) {
    console.error('Insert failed:', err && err.message ? err.message : err);
    process.exitCode = 3;
  } finally {
    try { await client.close(); } catch (_) {}
  }
}

main();
