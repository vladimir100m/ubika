#!/usr/bin/env node
/**
 * Destructive helper to drop all app tables. Use only in local/test DBs.
 * Usage: node scripts/drop-all-tables.js --confirm
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const args = process.argv.slice(2);
if (!args.includes('--confirm')) {
  console.error('This will drop all app tables. To proceed run: node scripts/drop-all-tables.js --confirm');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    console.log('Dropping app tables (destructive)...');
    await client.query('BEGIN');
    const drops = [
      'DROP TABLE IF EXISTS listings_history CASCADE',
      'DROP TABLE IF EXISTS property_feature_assignments CASCADE',
      'DROP TABLE IF EXISTS property_images CASCADE',
      'DROP TABLE IF EXISTS property_media CASCADE',
      'DROP TABLE IF EXISTS property_features CASCADE',
      'DROP TABLE IF EXISTS property_types CASCADE',
      'DROP TABLE IF EXISTS property_statuses CASCADE',
      'DROP TABLE IF EXISTS property_operation_statuses CASCADE',
      'DROP TABLE IF EXISTS user_saved_properties CASCADE',
      'DROP TABLE IF EXISTS neighborhoods CASCADE',
      'DROP TABLE IF EXISTS media_types CASCADE',
      'DROP TABLE IF EXISTS properties CASCADE'
    ];
    for (const s of drops) {
      console.log('DROP:', s);
      await client.query(s);
    }
    await client.query('COMMIT');
    console.log('Dropped app tables');
  } catch (err) {
    console.error('Error dropping tables:', err);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
