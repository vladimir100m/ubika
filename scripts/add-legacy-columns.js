#!/usr/bin/env node
/**
 * Add legacy columns to properties for backward compatibility with existing queries.
 * - Adds `type` TEXT, `room` INTEGER, `status` TEXT if they don't exist
 * - Backfills `type` from property_types.name via property_type_id
 * - Backfills `status` from property_statuses.name via property_status_id
 * - Backfills `room` from bedrooms (copy)
 *
 * Usage: node scripts/add-legacy-columns.js
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    console.log('Adding legacy columns if needed...');
    await client.query('BEGIN');

    // Add columns if not exist
    await client.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS type TEXT`);
    await client.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS room INTEGER`);
    await client.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS status TEXT`);

    console.log('Backfilling type from property_types...');
    await client.query(`
      UPDATE properties p
      SET type = pt.name
      FROM property_types pt
      WHERE p.property_type_id = pt.id
    `);

    console.log('Backfilling status from property_statuses...');
    await client.query(`
      UPDATE properties p
      SET status = ps.name
      FROM property_statuses ps
      WHERE p.property_status_id = ps.id
    `);

    console.log('Backfilling room from bedrooms...');
    await client.query(`UPDATE properties SET room = bedrooms WHERE room IS NULL`);

    await client.query('COMMIT');
    console.log('Legacy columns added and backfilled successfully');
  } catch (err) {
    console.error('Error adding legacy columns:', err);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
