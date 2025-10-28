#!/usr/bin/env node
// Run a verification SELECT to confirm legacy columns exist and queries succeed
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        p.id, p.title, p.description, p.price, p.address, p.city, p.state, p.country,
        p.zip_code, pt.name as property_type, p.bedrooms as rooms, p.bathrooms, p.square_meters as "squareMeters",
        NULL as image_url,
        ps.name as property_status, p.created_at, p.updated_at, p.year_built as yearBuilt,
        p.geocode, p.seller_id, p.operation_status_id,
        pos.name as operation_status, pos.display_name as operation_status_display
      FROM properties p
      LEFT JOIN property_operation_statuses pos ON p.operation_status_id = pos.id
      LEFT JOIN property_types pt ON p.property_type_id = pt.id
      LEFT JOIN property_statuses ps ON p.property_status_id = ps.id
      WHERE 1=1
      ORDER BY p.created_at DESC
      LIMIT 3
    `;

    const res = await client.query(query);
    console.log('Query OK, rows:', res.rowCount);
    console.log(res.rows);
  } catch (err) {
    console.error('Query failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
