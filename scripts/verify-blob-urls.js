#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function verifyBlobUrls() {
  try {
    console.log('🔍 Verifying Blob URLs in Database...\n');

    // Check total images by URL type
    const urlTypeRes = await pool.query(`
      SELECT 
        COUNT(*) as total_images,
        SUM(CASE WHEN image_url LIKE 'https://%' THEN 1 ELSE 0 END) as blob_urls,
        SUM(CASE WHEN image_url LIKE '/data/images%' THEN 1 ELSE 0 END) as local_urls,
        SUM(CASE WHEN image_url IS NULL THEN 1 ELSE 0 END) as null_urls
      FROM property_images
    `);

    const urlStats = urlTypeRes.rows[0];
    console.log('📊 Image URL Statistics:');
    console.log(`   Total images: ${urlStats.total_images}`);
    console.log(`   ✅ Blob URLs: ${urlStats.blob_urls}`);
    console.log(`   ℹ️  Local URLs: ${urlStats.local_urls}`);
    console.log(`   ⚠️  Null URLs: ${urlStats.null_urls}`);

    // Show sample blob URLs
    const sampleRes = await pool.query(`
      SELECT id, property_id, image_url 
      FROM property_images 
      WHERE image_url LIKE 'https://%'
      LIMIT 5
    `);

    if (sampleRes.rows.length > 0) {
      console.log('\n📷 Sample Blob URLs:');
      sampleRes.rows.forEach((row, idx) => {
        const shortUrl = row.image_url.substring(0, 80) + '...';
        console.log(`   ${idx + 1}. ${shortUrl}`);
      });
    }

    // Show properties with their image counts
    const propsRes = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.seller_id,
        COUNT(pi.id) as image_count,
        SUM(CASE WHEN pi.image_url LIKE 'https://%' THEN 1 ELSE 0 END) as blob_count
      FROM properties p
      LEFT JOIN property_images pi ON p.id = pi.property_id
      WHERE p.seller_id IN ('user_602b1234567890abcdef1234', 'user_602b1234567890abcdef5678')
      GROUP BY p.id, p.title, p.seller_id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    console.log('\n🏠 Properties with Image Status (Target Sellers):');
    propsRes.rows.forEach((row, idx) => {
      const status = row.blob_count === row.image_count ? '✅' : '⚠️ ';
      console.log(`   ${idx + 1}. ${row.title}`);
      console.log(`      Images: ${row.image_count} (${row.blob_count || 0} blob URLs)`);
    });

    console.log('\n✅ Verification complete!');
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyBlobUrls();
