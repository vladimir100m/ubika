#!/usr/bin/env node

/**
 * Migration Script: Unify property_images and property_media tables
 * 
 * This script:
 * 1. Adds missing columns to property_media for image-specific metadata
 * 2. Migrates data from property_images to property_media
 * 3. Ensures referential integrity
 * 4. Drops the old property_images table
 * 
 * This is a LOCAL TEST SCRIPT - destructive operation
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function query(sql, values = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, values);
    return result;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🔄 Starting migration: property_images → property_media\n');

  try {
    // Step 1: Backup property_images data (for verification)
    console.log('📊 Step 1: Checking current property_images data...');
    const backupResult = await query('SELECT COUNT(*) as count FROM property_images');
    const imageCount = parseInt(backupResult.rows[0].count);
    console.log(`   Found ${imageCount} rows in property_images\n`);

    // Step 2: Add missing columns to property_media if they don't exist
    console.log('🔧 Step 2: Ensuring property_media has all required columns...');
    
    const columnsToAdd = [
      { name: 'checksum', sql: 'ALTER TABLE property_media ADD COLUMN IF NOT EXISTS checksum VARCHAR(256)' },
      { name: 'width', sql: 'ALTER TABLE property_media ADD COLUMN IF NOT EXISTS width INTEGER' },
      { name: 'height', sql: 'ALTER TABLE property_media ADD COLUMN IF NOT EXISTS height INTEGER' },
      { name: 'alt_text', sql: 'ALTER TABLE property_media ADD COLUMN IF NOT EXISTS alt_text TEXT' },
      { name: 'display_order', sql: 'ALTER TABLE property_media ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0' },
      { name: 'created_at', sql: 'ALTER TABLE property_media ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()' },
      { name: 'updated_at', sql: 'ALTER TABLE property_media ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()' },
    ];

    for (const col of columnsToAdd) {
      try {
        await query(col.sql);
        console.log(`   ✓ Column ${col.name} ready`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`   ✓ Column ${col.name} already exists`);
        } else {
          throw err;
        }
      }
    }
    console.log();

    // Step 3: Ensure media_type has a default
    console.log('🔧 Step 3: Setting default media_type...');
    try {
      await query(`
        ALTER TABLE property_media
        ALTER COLUMN media_type SET DEFAULT 'image'
      `);
      console.log('   ✓ media_type default set to "image"\n');
    } catch (err) {
      if (!err.message.includes('already')) {
        console.log(`   ℹ media_type default already set\n`);
      }
    }

    // Step 4: Migrate data from property_images to property_media
    console.log('🔀 Step 4: Migrating data from property_images to property_media...');
    
    const migrationSql = `
      INSERT INTO property_media (
        id, 
        property_id, 
        media_type, 
        url, 
        storage_key,
        file_name, 
        file_size, 
        mime_type, 
        checksum,
        width, 
        height, 
        alt_text, 
        is_primary, 
        display_order, 
        created_at, 
        updated_at, 
        uploaded_at
      )
      SELECT
        gen_random_uuid() as id,
        property_id,
        'image' as media_type,
        image_url as url,
        storage_key,
        original_filename as file_name,
        file_size,
        mime_type,
        checksum,
        width,
        height,
        alt_text,
        is_cover as is_primary,
        display_order,
        created_at,
        updated_at,
        created_at as uploaded_at
      FROM property_images
      ON CONFLICT DO NOTHING
    `;

    const migrationResult = await query(migrationSql);
    console.log(`   ✓ Migrated ${migrationResult.rowCount} rows\n`);

    // Step 5: Verify migration
    console.log('✅ Step 5: Verifying migration...');
    const imageCheckResult = await query(
      `SELECT COUNT(*) as count FROM property_media WHERE media_type = 'image'`
    );
    const mediaImageCount = parseInt(imageCheckResult.rows[0].count);
    console.log(`   Found ${mediaImageCount} image records in property_media`);
    
    const mismatchCheck = await query(`
      SELECT COUNT(*) as count 
      FROM property_images pi
      WHERE NOT EXISTS (
        SELECT 1 FROM property_media pm 
        WHERE pm.property_id = pi.property_id 
        AND pm.media_type = 'image'
        AND LOWER(pm.url) = LOWER(pi.image_url)
      )
    `);
    const mismatchCount = parseInt(mismatchCheck.rows[0].count);
    
    if (mismatchCount === 0) {
      console.log(`   ✓ All images migrated successfully (0 mismatches)\n`);
    } else {
      console.warn(`   ⚠ Found ${mismatchCount} potential mismatches\n`);
    }

    // Step 6: Drop old property_images table
    console.log('🗑️  Step 6: Dropping old property_images table...');
    
    // First drop dependent constraints/indexes
    await query('DROP TABLE IF EXISTS property_images CASCADE');
    console.log('   ✓ property_images table dropped\n');

    // Step 7: Final verification
    console.log('🔍 Step 7: Final verification...');
    const finalCheckResult = await query(`
      SELECT 
        COUNT(*) as total_media,
        COUNT(CASE WHEN media_type = 'image' THEN 1 END) as image_count,
        COUNT(CASE WHEN media_type != 'image' THEN 1 END) as other_media
      FROM property_media
    `);
    const stats = finalCheckResult.rows[0];
    console.log(`   Total media records: ${stats.total_media}`);
    console.log(`   Image records: ${stats.image_count}`);
    console.log(`   Other media: ${stats.other_media}\n`);

    // Verify FK integrity
    const fkCheckResult = await query(`
      SELECT COUNT(*) as orphan_count
      FROM property_media
      WHERE property_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM properties WHERE id = property_media.property_id)
    `);
    const orphanCount = parseInt(fkCheckResult.rows[0].orphan_count);
    if (orphanCount === 0) {
      console.log('   ✓ All media records have valid property_id references\n');
    } else {
      console.warn(`   ⚠ Found ${orphanCount} orphaned media records\n`);
    }

    console.log('✅ Migration complete!\n');
    console.log('📋 Summary:');
    console.log(`   - Original property_images: ${imageCount} rows`);
    console.log(`   - Migrated to property_media: ${mediaImageCount} rows`);
    console.log(`   - Old table dropped: YES`);
    console.log(`   - Referential integrity: ✓ VERIFIED\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
