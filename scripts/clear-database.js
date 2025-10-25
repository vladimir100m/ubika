#!/usr/bin/env node

/**
 * Clear all database data - reset to empty state
 * This truncates all tables and resets sequences
 */

const path = require('path');
const pkg = require('pg');
const { Pool } = pkg;

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clearDatabase() {
  const client = await pool.connect();
  try {
    console.log('🗑️  Database Clear Script\n');
    console.log('⚠️  WARNING: This will DELETE ALL DATA from the database!\n');

    // Get confirmation
    const answer = await new Promise((resolve) => {
      process.stdout.write('Type "YES" to confirm: ');
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim());
      });
    });

    if (answer !== 'YES') {
      console.log('\n❌ Cancelled. Database not cleared.');
      process.exit(0);
    }

    console.log('\n🔄 Starting database clear...\n');

    // List of tables to truncate (order matters due to foreign keys)
    const tablesToTruncate = [
      'property_images',
      'property_operation_statuses',
      'property_statuses',
      'property_types',
      'property_features',
      'neighborhoods',
      'properties',
    ];

    console.log('📋 Truncating tables:');

    for (const table of tablesToTruncate) {
      try {
        await client.query(`TRUNCATE TABLE ${table} CASCADE`);
        console.log(`   ✓ ${table}`);
      } catch (err) {
        // Some tables might not exist, that's ok
        console.log(`   ⊘ ${table} (table may not exist or already empty)`);
      }
    }

    // Reset sequences (auto-increment counters)
    console.log('\n🔄 Resetting sequences:');

    const sequencesToReset = [
      'properties_id_seq',
      'property_images_id_seq',
      'property_operation_statuses_id_seq',
      'property_statuses_id_seq',
      'property_types_id_seq',
      'property_features_id_seq',
      'neighborhoods_id_seq',
    ];

    for (const seq of sequencesToReset) {
      try {
        await client.query(`ALTER SEQUENCE ${seq} RESTART WITH 1`);
        console.log(`   ✓ ${seq}`);
      } catch (err) {
        // Some sequences might not exist, that's ok
        console.log(`   ⊘ ${seq} (sequence may not exist)`);
      }
    }

    // Verify database is empty
    console.log('\n📊 Verifying database is empty:');

    const tableCheckQueries = [
      `SELECT COUNT(*) as count FROM properties`,
      `SELECT COUNT(*) as count FROM property_images`,
    ];

    let totalRecords = 0;
    for (const query of tableCheckQueries) {
      const res = await client.query(query);
      const count = res.rows[0].count;
      totalRecords += parseInt(count, 10);
      console.log(`   ${query.match(/FROM (\w+)/)[1]}: ${count} records`);
    }

    if (totalRecords === 0) {
      console.log('\n✅ Database is completely empty!');
    } else {
      console.log(`\n⚠️  Warning: Database still has ${totalRecords} records`);
    }

    console.log('\n💡 Next steps:');
    console.log('   1. Run: node scripts/create-fictional-properties.js');
    console.log('   2. Run: node scripts/clear-all-cache.js');
    console.log('   3. Go to http://localhost:3000/seller');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

clearDatabase();
