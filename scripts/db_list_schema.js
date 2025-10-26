#!/usr/bin/env node
/*
  List public schema tables and columns as JSON.
  Run: node scripts/db_list_schema.js
*/
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in .env.local');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  const client = await pool.connect();
  try {
    const rows = await client.query(
      `SELECT table_name, column_name, data_type, is_nullable, character_maximum_length, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public'
       ORDER BY table_name, ordinal_position`
    );

    const tables = {};
    for (const r of rows.rows) {
      if (!tables[r.table_name]) tables[r.table_name] = [];
      tables[r.table_name].push({
        column: r.column_name,
        type: r.data_type,
        nullable: r.is_nullable === 'YES',
        maxLength: r.character_maximum_length,
        default: r.column_default || null
      });
    }

    const outPath = path.resolve(__dirname, '../tmp/db_schema.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(tables, null, 2));
    console.log('Wrote schema to', outPath);
  } catch (err) {
    console.error('Error querying schema:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
