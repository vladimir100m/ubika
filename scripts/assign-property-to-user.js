#!/usr/bin/env node

/**
 * Quick fix: Assign property to the current logged-in user
 * Usage: node scripts/assign-property-to-user.js <property_id> <user_id>
 * 
 * This script helps fix ownership issues by reassigning a property to the correct user
 */

const path = require('path');
const pkg = require('pg');
const { Pool } = pkg;

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function assignPropertyToUser() {
  const propertyId = process.argv[2];
  const userId = process.argv[3];

  if (!propertyId || !userId) {
    console.log('❌ Usage: node scripts/assign-property-to-user.js <property_id> <user_id>');
    console.log('');
    console.log('Example:');
    console.log('   node scripts/assign-property-to-user.js 38913264-517b-4ae9-8309-ea507cc8af01 vladimir.aap@gmail.com');
    console.log('');
    console.log('💡 To get your user ID, visit: http://localhost:3000/api/debug/current-user');
    process.exit(1);
  }

  const client = await pool.connect();
  
  try {
    console.log('🔧 Assigning Property to User\n');
    console.log(`Property ID: ${propertyId}`);
    console.log(`User ID: ${userId}\n`);

    // Check if property exists
    const propertyCheck = await client.query(
      'SELECT id, title, seller_id FROM properties WHERE id = $1',
      [propertyId]
    );

    if (propertyCheck.rows.length === 0) {
      console.log('❌ Property not found with that ID');
      process.exit(1);
    }

    const property = propertyCheck.rows[0];
    console.log(`📋 Property found: "${property.title}"`);
    console.log(`📋 Current owner: ${property.seller_id}\n`);

    // Update property ownership
    const updateResult = await client.query(
      'UPDATE properties SET seller_id = $1, updated_at = NOW() WHERE id = $2 RETURNING title, seller_id',
      [userId, propertyId]
    );

    if (updateResult.rows.length > 0) {
      const updated = updateResult.rows[0];
      console.log('✅ Property ownership updated successfully!');
      console.log(`✅ Property: "${updated.title}"`);
      console.log(`✅ New owner: ${updated.seller_id}\n`);
      
      console.log('🎉 You can now upload images to this property!');
      console.log('💡 Try uploading images again in your application.');
    } else {
      console.log('❌ Failed to update property ownership');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

assignPropertyToUser();