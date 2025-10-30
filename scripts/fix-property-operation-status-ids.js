// scripts/fix-property-operation-status-ids.js
// Replace property_operation_statuses rows with explicit IDs (1..4)
// Mapping: 1 -> sale, 2 -> rent, 3 -> buy, 4 -> lease

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Deleting existing rows from property_operation_statuses');
    await client.query('DELETE FROM property_operation_statuses');

    const rows = [
      [1, 'sale', 'Sale', '#2ecc40'],
      [2, 'rent', 'Rent', '#0074d9'],
      [3, 'buy', 'Buy', '#ffdc00'],
      [4, 'lease', 'Lease', '#b10dc9'],
    ];

    for (const [id, name, display, color] of rows) {
      await client.query('INSERT INTO property_operation_statuses (id, name, display_name, color) VALUES ($1,$2,$3,$4)', [id, name, display, color]);
    }

    // Reset sequence to max(id)
    await client.query("SELECT setval(pg_get_serial_sequence('property_operation_statuses','id'), (SELECT MAX(id) FROM property_operation_statuses))");

    await client.query('COMMIT');
    console.log('Replaced operation statuses with IDs 1..4');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
