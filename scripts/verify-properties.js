#!/usr/bin/env node
/**
 * Verification script to check created properties
 */

const path = require('path');
const pkg = require('pg');
const { Pool } = pkg;

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verifying properties creation...\n');
    
    // Count total properties
    const countRes = await client.query('SELECT COUNT(*) as count FROM properties');
    console.log(`📊 Total properties in database: ${countRes.rows[0].count}`);
    
    // Group by seller
    const sellerRes = await client.query(`
      SELECT seller_id, COUNT(*) as count FROM properties GROUP BY seller_id ORDER BY seller_id
    `);
    console.log('\n👥 Properties by seller:');
    sellerRes.rows.forEach(row => {
      console.log(`   - ${row.seller_id}: ${row.count} properties`);
    });
    
    // Count images
    const imagesRes = await client.query('SELECT COUNT(*) as count FROM property_images');
    console.log(`\n📷 Total images in database: ${imagesRes.rows[0].count}`);
    
    // Show recent properties
    console.log('\n🏠 Recently created properties:');
    const propsRes = await client.query(`
      SELECT id, title, address, city, price, room as bedrooms, bathrooms, seller_id 
      FROM properties 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    propsRes.rows.forEach((prop, idx) => {
      console.log(`\n   ${idx + 1}. ${prop.title}`);
      console.log(`      Address: ${prop.address}, ${prop.city}`);
      console.log(`      Bedrooms: ${prop.bedrooms}, Bathrooms: ${prop.bathrooms}`);
      console.log(`      Price: $${prop.price}`);
      console.log(`      Seller: ${prop.seller_id}`);
    });
    
    console.log('\n✅ Verification complete!');
    
  } finally {
    client.release();
    await pool.end();
  }
}

verify().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
