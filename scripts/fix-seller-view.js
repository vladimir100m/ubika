#!/usr/bin/env node

/**
 * Fix seller view - reassign test properties to a common seller ID
 * This script updates test properties to use a consistent seller ID for testing
 */

const path = require('path');
const pkg = require('pg');
const { Pool } = pkg;

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Use a test seller ID that we can reference
const TEST_SELLER_ID = 'test-seller-001';
const TARGET_SELLERS = [
  'user_602b1234567890abcdef1234',
  'user_602b1234567890abcdef5678'
];

async function fixSellerView() {
  try {
    console.log('🔧 Fixing Seller View - Reassigning Properties\n');

    // Step 1: Get current state
    const beforeRes = await pool.query(`
      SELECT seller_id, COUNT(*) as count
      FROM properties
      WHERE seller_id = ANY($1)
      GROUP BY seller_id
    `, [TARGET_SELLERS]);

    console.log('📊 Current property distribution:');
    let totalBefore = 0;
    beforeRes.rows.forEach((row) => {
      console.log(`   - ${row.seller_id}: ${row.count} properties`);
      totalBefore += parseInt(row.count, 10);
    });
    console.log(`   Total: ${totalBefore} properties\n`);

    // Step 2: Reassign all test properties
    console.log(`🔄 Reassigning all ${totalBefore} properties to: ${TEST_SELLER_ID}\n`);

    const updateRes = await pool.query(`
      UPDATE properties
      SET seller_id = $1
      WHERE seller_id = ANY($2)
      RETURNING id
    `, [TEST_SELLER_ID, TARGET_SELLERS]);

    console.log(`✅ Reassigned ${updateRes.rows.length} properties\n`);

    // Step 3: Show current state
    const afterRes = await pool.query(`
      SELECT seller_id, COUNT(*) as count
      FROM properties
      WHERE seller_id = $1
      GROUP BY seller_id
    `, [TEST_SELLER_ID]);

    console.log('📊 New property distribution:');
    afterRes.rows.forEach((row) => {
      console.log(`   - ${row.seller_id}: ${row.count} properties`);
    });

    // Step 4: Show next steps
    console.log('\n💡 Next steps to view properties in seller dashboard:');
    console.log(`\n1. Open the /api/debug/current-user endpoint in your browser:`);
    console.log(`   http://localhost:3000/api/debug/current-user`);
    console.log(`\n2. You'll see your current Google user ID`);
    console.log(`\n3. Run this command to assign properties to your user:`);
    console.log(`   node scripts/reassign-properties.js ${TEST_SELLER_ID} <YOUR_USER_ID>`);
    console.log(`\n4. Then go to http://localhost:3000/seller to see your properties`);
    console.log(`\n5. Clear cache if needed: node scripts/clear-all-cache.js`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixSellerView();
