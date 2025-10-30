// scripts/update-property-operation-statuses.js
// Script to update property_operation_statuses table

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function run() {
  const client = await pool.connect();
  try {
    // 0. Ensure color column exists — check information_schema
    const colCheck = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'property_operation_statuses' AND column_name = 'color'`
    );
    if (colCheck.rows.length === 0) {
      console.log("Column 'color' not found on property_operation_statuses — adding column...");
      await client.query("ALTER TABLE property_operation_statuses ADD COLUMN color VARCHAR(20)");
      console.log("Column 'color' added.");
    }

    // 1. Check current data
    const { rows: currentRows } = await client.query('SELECT id, name, display_name, description, color FROM property_operation_statuses ORDER BY id');
    console.log('Current property_operation_statuses:');
    currentRows.forEach(row => console.log(row));

    // 2. Delete all data
    await client.query('DELETE FROM property_operation_statuses');
    console.log('All data deleted.');

    // 3. Add new data with colors
    const newStatuses = [
      { name: 'sale', display_name: 'Sale', color: '#2ecc40' },      // Green
      { name: 'rent', display_name: 'Rent', color: '#0074d9' },      // Blue
      { name: 'buy', display_name: 'Buy', color: '#ffdc00' },        // Yellow
      { name: 'lease', display_name: 'Lease', color: '#b10dc9' },   // Purple
    ];
    for (const status of newStatuses) {
      await client.query(
        'INSERT INTO property_operation_statuses (name, display_name, color) VALUES ($1, $2, $3)',
        [status.name, status.display_name, status.color]
      );
    }
    console.log('New statuses added.');

    // 4. Show new data
    const { rows: newRows } = await client.query('SELECT id, name, display_name, color FROM property_operation_statuses ORDER BY id');
    console.log('Updated property_operation_statuses:');
    newRows.forEach(row => console.log(row));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
