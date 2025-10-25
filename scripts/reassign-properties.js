#!/usr/bin/env node

/**
 * Script to reassign properties to a different seller
 * Usage: node scripts/reassign-properties.js <from_seller_id> <to_seller_id>
 * Example: node scripts/reassign-properties.js user_602b1234567890abcdef1234 102718398123456789
 */

const path = require('path');
const pkg = require('pg');
const { Pool } = pkg;

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function reassignProperties() {
  const fromSellerId = process.argv[2];
  const toSellerId = process.argv[3];

  if (!fromSellerId || !toSellerId) {
    console.log('❌ Usage: node scripts/reassign-properties.js <from_seller_id> <to_seller_id>');
    console.log('\n💡 Example:');
    console.log('   node scripts/reassign-properties.js user_602b1234567890abcdef1234 102718398123456789');
    process.exit(1);
  }

  try {
    console.log(`🔄 Reassigning properties from "${fromSellerId}" to "${toSellerId}"...\n`);

    // Get properties to reassign
    const checkRes = await pool.query(
      'SELECT id, title FROM properties WHERE seller_id = $1 LIMIT 10',
      [fromSellerId]
    );

    if (checkRes.rows.length === 0) {
      console.log(`❌ No properties found for seller: ${fromSellerId}`);
      process.exit(1);
    }

    console.log(`Found ${checkRes.rows.length} properties to reassign:`);
    checkRes.rows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.title}`);
    });

    // Reassign properties
    const updateRes = await pool.query(
      'UPDATE properties SET seller_id = $1 WHERE seller_id = $2 RETURNING id',
      [toSellerId, fromSellerId]
    );

    console.log(`\n✅ Successfully reassigned ${updateRes.rows.length} properties!`);
    console.log(`\n💡 Next steps:`);
    console.log('   1. Log in with the user that has this ID/email');
    console.log('   2. Go to /seller to see the properties');
    console.log('   3. Clear cache: node scripts/clear-all-cache.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

reassignProperties();
