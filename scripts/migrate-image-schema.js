#!/usr/bin/env node

/**
 * Database Migration Script for Enhanced Image Schema
 * This script adds new columns to the property_images table for better metadata support
 */

const path = require('path');
const pkg = require('pg');
const { Pool } = pkg;

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const migrations = [
  {
    name: 'Add file_size column',
    sql: `ALTER TABLE property_images ADD COLUMN IF NOT EXISTS file_size INTEGER;`
  },
  {
    name: 'Add mime_type column',
    sql: `ALTER TABLE property_images ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);`
  },
  {
    name: 'Add original_filename column',
    sql: `ALTER TABLE property_images ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);`
  },
  {
    name: 'Add blob_path column',
    sql: `ALTER TABLE property_images ADD COLUMN IF NOT EXISTS blob_path VARCHAR(500);`
  },
  {
    name: 'Add alt_text column',
    sql: `ALTER TABLE property_images ADD COLUMN IF NOT EXISTS alt_text TEXT;`
  },
  {
    name: 'Add updated_at column',
    sql: `ALTER TABLE property_images ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`
  },
  {
    name: 'Create property_id index',
    sql: `CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);`,
    concurrent: false
  },
  {
    name: 'Create cover order index',
    sql: `CREATE INDEX IF NOT EXISTS idx_property_images_cover_order ON property_images(property_id, is_cover DESC, display_order ASC);`,
    concurrent: false
  },
  {
    name: 'Add valid display order constraint',
    sql: `DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'chk_valid_display_order') THEN
              ALTER TABLE property_images ADD CONSTRAINT chk_valid_display_order CHECK (display_order >= 0);
            END IF;
          END $$;`
  },
  {
    name: 'Add valid file size constraint',
    sql: `DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'chk_valid_file_size') THEN
              ALTER TABLE property_images ADD CONSTRAINT chk_valid_file_size CHECK (file_size IS NULL OR file_size > 0);
            END IF;
          END $$;`
  }
];

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Database Migration for Enhanced Image Schema\n');

    // Begin transaction
    await client.query('BEGIN');

    let successCount = 0;
    let skipCount = 0;

    for (const migration of migrations) {
      try {
        console.log(`📝 Running: ${migration.name}...`);
        await client.query(migration.sql);
        console.log(`✅ Success: ${migration.name}`);
        successCount++;
      } catch (error) {
        if (error.code === '42701' || error.message.includes('already exists')) {
          console.log(`⏭️  Skipped: ${migration.name} (already exists)`);
          skipCount++;
        } else {
          console.error(`❌ Failed: ${migration.name}`, error.message);
          throw error;
        }
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    console.log(`📝 Total: ${migrations.length}\n`);

    // Show current schema
    console.log('📋 Current property_images schema:');
    const schemaResult = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'property_images' 
      ORDER BY ordinal_position
    `);

    schemaResult.rows.forEach(row => {
      console.log(`   ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n🎉 Migration completed successfully!');
    console.log('💡 You can now upload images with enhanced metadata support.');

  } catch (error) {
    // Rollback transaction
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    console.error('🔄 All changes have been rolled back.');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();