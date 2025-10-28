#!/usr/bin/env node

/**
 * Schema Introspection Script
 * 
 * Connects to Neon database using DATABASE_URL from .env.local
 * Extracts comprehensive schema information
 * 
 * Usage: node scripts/introspect-schema.js > doc/schema-introspection.json
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not found in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * Get all tables in the public schema
 */
async function getTables() {
  const result = await pool.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `);
  return result.rows.map(r => r.tablename);
}

/**
 * Get table columns with types and constraints
 */
async function getTableColumns(tableName) {
  const result = await pool.query(`
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);
  return result.rows;
}

/**
 * Get primary key for a table
 */
async function getPrimaryKey(tableName) {
  const result = await pool.query(`
    SELECT a.attname
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid
    AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = $1::regclass AND i.indisprimary
  `, [tableName]);
  return result.rows.map(r => r.attname);
}

/**
 * Get foreign keys for a table
 */
async function getForeignKeys(tableName) {
  const result = await pool.query(`
    SELECT
      kcu.column_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    LEFT JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND kcu.table_name = $1
  `, [tableName]);
  return result.rows;
}

/**
 * Get indexes for a table
 */
async function getIndexes(tableName) {
  const result = await pool.query(`
    SELECT
      indexname,
      indexdef
    FROM pg_indexes
    WHERE tablename = $1 AND schemaname = 'public'
  `, [tableName]);
  return result.rows;
}

/**
 * Get row count and size for a table
 */
async function getTableStats(tableName) {
  try {
    const countResult = await pool.query(`SELECT COUNT(*) as cnt FROM "${tableName}"`);
    const sizeResult = await pool.query(`
      SELECT 
        pg_size_pretty(pg_total_relation_size($1::regclass)) as total_size
    `, [tableName]);
    
    return {
      rowCount: parseInt(countResult.rows[0]?.cnt || 0),
      totalSize: sizeResult.rows[0]?.total_size || 'unknown'
    };
  } catch (e) {
    return { rowCount: 0, totalSize: 'unknown' };
  }
}

/**
 * Main introspection function
 */
async function introspectSchema() {
  try {
    console.error('🔍 Introspecting Neon database schema...');
    
    const tables = await getTables();
    console.error(`✓ Found ${tables.length} tables`);
    
    const schema = {
      metadata: {
        generatedAt: new Date().toISOString(),
        database: (DATABASE_URL.split('/').pop() || '').split('?')[0],
        environment: 'neon',
        tables: tables.length
      },
      tables: {},
      relationships: []
    };

    // Collect all foreign keys for relationships summary
    const allForeignKeys = [];

    for (const tableName of tables) {
      process.stderr.write(`  📋 ${tableName}... `);
      
      const columns = await getTableColumns(tableName);
      const pk = await getPrimaryKey(tableName);
      const fks = await getForeignKeys(tableName);
      const indexes = await getIndexes(tableName);
      const stats = await getTableStats(tableName);

      schema.tables[tableName] = {
        columns: columns.map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default
        })),
        primaryKey: pk,
        foreignKeys: fks,
        indexes: indexes,
        statistics: stats
      };

      allForeignKeys.push(...fks.map(fk => ({
        from: `${tableName}.${fk.column_name}`,
        to: `${fk.referenced_table}.${fk.referenced_column}`,
        deleteRule: fk.delete_rule,
        updateRule: fk.update_rule
      })));

      console.error('✓');
    }

    schema.relationships = allForeignKeys;

    // Output JSON to stdout
    console.log(JSON.stringify(schema, null, 2));
    console.error('✅ Schema introspection complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run introspection
introspectSchema();
