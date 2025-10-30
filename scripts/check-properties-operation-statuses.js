// scripts/check-properties-operation-statuses.js
// Check property rows and their operation status join
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false });

async function run() {
  const client = await pool.connect();
  try {
    const q = `
      SELECT p.id, p.title, p.operation_status_id, pos.id as pos_id, pos.name as pos_name, pos.display_name as pos_display, pos.color as pos_color
      FROM properties p
      LEFT JOIN property_operation_statuses pos ON p.operation_status_id = pos.id
      ORDER BY p.created_at DESC
      LIMIT 20
    `;
    const { rows } = await client.query(q);
    console.log('Sample properties with operation status:');
    rows.forEach(r => console.log(r));
  } catch (err) {
    console.error('Error querying properties:', err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
