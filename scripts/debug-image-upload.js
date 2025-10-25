#!/usr/bin/env node

/**
 * Debug script to check image upload issues
 * Verifies:
 * 1. Properties exist in database
 * 2. Properties have correct seller_id
 * 3. Check property_images table for records
 * 4. Verify blob URL format
 */

const path = require('path');
const pkg = require('pg');
const { Pool } = pkg;

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debug() {
  const client = await pool.connect();
  try {
    console.log('🔍 Image Upload Debug Report\n');
    console.log('='.repeat(60) + '\n');

    // Get current user ID from environment or command line
    const userId = process.argv[2];
    if (!userId) {
      console.log('❌ Usage: node scripts/debug-image-upload.js <user_id>');
      console.log('\nExample:');
      console.log('  node scripts/debug-image-upload.js 106792838405737364934\n');
      process.exit(1);
    }

    console.log(`👤 Debugging for user: ${userId}\n`);

    // 1. Check properties
    console.log('1️⃣  PROPERTIES CHECK');
    console.log('-'.repeat(60));
    const propertiesRes = await client.query(`
      SELECT id, title, seller_id, created_at
      FROM properties
      WHERE seller_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [userId]);

    console.log(`   Found ${propertiesRes.rows.length} properties for this user\n`);
    propertiesRes.rows.forEach((prop, idx) => {
      console.log(`   ${idx + 1}. ${prop.title}`);
      console.log(`      ID: ${prop.id}`);
      console.log(`      Seller: ${prop.seller_id}`);
      console.log(`      Created: ${prop.created_at}\n`);
    });

    if (propertiesRes.rows.length === 0) {
      console.log('⚠️  No properties found! Create a property first.\n');
    }

    // 2. Check property_images
    console.log('2️⃣  PROPERTY IMAGES CHECK');
    console.log('-'.repeat(60));
    
    const imagesRes = await client.query(`
      SELECT pi.id, pi.property_id, pi.image_url, pi.is_cover, pi.created_at, p.title, p.seller_id
      FROM property_images pi
      JOIN properties p ON p.id = pi.property_id
      WHERE p.seller_id = $1
      ORDER BY pi.created_at DESC
      LIMIT 10
    `, [userId]);

    console.log(`   Found ${imagesRes.rows.length} images for this user\n`);
    
    if (imagesRes.rows.length === 0) {
      console.log('⚠️  No images in database! Images not being registered.\n');
      console.log('   This could be due to:');
      console.log('   - API returning 403 (ownership check failing)');
      console.log('   - API returning 500 (database error)');
      console.log('   - Frontend error (check browser console)\n');
    } else {
      imagesRes.rows.forEach((img, idx) => {
        const blobMatch = img.image_url.match(/blob\.vercel/);
        const isBlob = blobMatch ? '✅ Blob URL' : '❌ Not Blob URL';
        
        console.log(`   ${idx + 1}. ${img.title}`);
        console.log(`      Image ID: ${img.id}`);
        console.log(`      URL: ${img.image_url.substring(0, 50)}...`);
        console.log(`      Type: ${isBlob}`);
        console.log(`      Cover: ${img.is_cover ? 'Yes' : 'No'}`);
        console.log(`      Created: ${img.created_at}\n`);
      });
    }

    // 3. Check for NULL seller_id properties
    console.log('3️⃣  PROPERTIES WITH NULL SELLER_ID');
    console.log('-'.repeat(60));
    const nullSellerRes = await client.query(`
      SELECT id, title, created_at, (
        SELECT COUNT(*) FROM property_images WHERE property_id = properties.id
      ) as image_count
      FROM properties
      WHERE seller_id IS NULL
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (nullSellerRes.rows.length > 0) {
      console.log(`   Found ${nullSellerRes.rows.length} properties with NULL seller_id\n`);
      nullSellerRes.rows.forEach((prop, idx) => {
        console.log(`   ${idx + 1}. ${prop.title}`);
        console.log(`      ID: ${prop.id}`);
        console.log(`      Images: ${prop.image_count}`);
        console.log(`      Created: ${prop.created_at}\n`);
      });
      console.log('   ℹ️  You can assign these properties to a user with reassign-properties.js\n');
    } else {
      console.log('   ✅ No properties with NULL seller_id\n');
    }

    // 4. Total stats
    console.log('4️⃣  DATABASE STATISTICS');
    console.log('-'.repeat(60));
    const statsRes = await client.query(`
      SELECT 
        COUNT(*) as total_properties,
        COUNT(DISTINCT seller_id) as unique_sellers,
        (SELECT COUNT(*) FROM property_images) as total_images
      FROM properties
    `);

    const stats = statsRes.rows[0];
    console.log(`   Total properties: ${stats.total_properties}`);
    console.log(`   Unique sellers: ${stats.unique_sellers}`);
    console.log(`   Total images: ${stats.total_images}\n`);

    // 5. Recommendations
    console.log('5️⃣  NEXT STEPS');
    console.log('-'.repeat(60));
    console.log(`
   If images are NOT being registered:
   
   1. Open browser Developer Tools (F12)
   2. Go to Network tab
   3. Upload an image
   4. Look for POST request to /api/properties/images
   5. Check the response:
      - 200 OK = Success (check database)
      - 401 Unauthorized = Session issue
      - 403 Forbidden = Seller ID mismatch
      - 500 Internal Server Error = Database error
   
   6. Check the console for error details from PropertyImageEditor.tsx
   
   7. If still failing, check logs in terminal where 'npm run dev' is running
    `);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

debug();
