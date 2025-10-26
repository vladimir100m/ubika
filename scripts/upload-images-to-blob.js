#!/usr/bin/env node
/**
 * Script to upload images to Vercel Blob storage and update database
 * 
 * Steps:
 * 1. Identify new properties (created in last batch)
 * 2. Upload images from data/images to Vercel blob
 * 3. Update property_images table with blob URLs
 * 
 * Usage: node scripts/upload-images-to-blob.js
 */

const fs = require('fs');
const path = require('path');
const pkg = require('pg');
const { Pool } = pkg;
const { put } = require('@vercel/blob');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Configuration
const DATABASE_URL = process.env.DATABASE_URL;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const IMAGES_DIR = path.resolve(__dirname, '../data/images');
const TARGET_SELLERS = [
  'user_602b1234567890abcdef1234',
  'user_602b1234567890abcdef5678'
];

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not configured');
  process.exit(1);
}

if (!BLOB_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN not configured');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper to upload image to Vercel blob
async function uploadImageToBlob(imagePath, filename) {
  try {
    const fileBuffer = fs.readFileSync(imagePath);
    const mimeType = getMimeType(filename);
    
    console.log(`   📤 Uploading: ${filename}`);
    
    // Upload with just the filename (no path prefix)
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      token: BLOB_TOKEN,
      contentType: mimeType
    });
    
    // Extract just the full URL from the blob response
    const blobUrl = blob.url;
    console.log(`      ✓ Blob URL: ${blobUrl}`);
    return blobUrl;
  } catch (error) {
    console.error(`      ✗ Error uploading ${filename}:`, error.message);
    throw error;
  }
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return types[ext] || 'image/jpeg';
}

async function main() {
  const client = await pool.connect();
  let imagesUploadedCount = 0;
  let imagesUpdatedCount = 0;
  const uploadedUrls = new Map(); // Map filename -> blob URL
  
  try {
    console.log('🚀 Image Upload to Vercel Blob Script\n');
    
    // Step 1: Identify new properties
    console.log('🔍 Step 1: Identifying new properties...\n');
    
    const propsQuery = `
      SELECT p.id, p.title, p.address, p.city, p.seller_id
      FROM properties p
      WHERE p.seller_id = ANY($1)
      ORDER BY p.created_at DESC
      LIMIT 50
    `;
    
    const propsResult = await client.query(propsQuery, [TARGET_SELLERS]);
    const newProperties = propsResult.rows;
    
    console.log(`✓ Found ${newProperties.length} properties from target sellers:`);
    newProperties.forEach((prop, idx) => {
      console.log(`   ${idx + 1}. ${prop.title} (ID: ${prop.id})`);
    });
    
    // Step 2: Get all images in data/images directory
    console.log('\n📷 Step 2: Preparing images for upload...\n');
    
    const imageFiles = fs.readdirSync(IMAGES_DIR)
      .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    
    console.log(`✓ Found ${imageFiles.length} image files:`);
    imageFiles.forEach(img => console.log(`   - ${img}`));
    
    // Step 3: Upload images to Vercel blob (one time, reuse for all properties)
    console.log('\n☁️  Step 3: Uploading images to Vercel Blob...\n');
    
    for (const imageFile of imageFiles) {
      const imagePath = path.join(IMAGES_DIR, imageFile);
      const blobUrl = await uploadImageToBlob(imagePath, `ubika/${imageFile}`);
      uploadedUrls.set(imageFile, blobUrl);
      imagesUploadedCount++;
    }
    
    console.log(`\n✓ Successfully uploaded ${imagesUploadedCount} images to blob`);
    
    // Step 4: Update property_images table with blob URLs
    console.log('\n🗄️  Step 4: Updating property_images table...\n');
    
    // Get all property_images for our properties
    const imagesQuery = `
      SELECT pi.id, pi.property_id, pi.image_url, pi.is_cover, pi.display_order
      FROM property_images pi
      JOIN properties p ON pi.property_id = p.id
      WHERE p.seller_id = ANY($1)
      ORDER BY pi.property_id, pi.display_order
    `;
    
    const imagesResult = await client.query(imagesQuery, [TARGET_SELLERS]);
    const propertyImages = imagesResult.rows;
    
    console.log(`✓ Found ${propertyImages.length} image records to update\n`);
    
    // Update each image record with blob URL
    let propertyIdx = 1;
    let currentPropertyId = null;
    
    for (const img of propertyImages) {
      if (img.property_id !== currentPropertyId) {
        currentPropertyId = img.property_id;
        console.log(`Property #${propertyIdx}: ${img.property_id}`);
        propertyIdx++;
      }
      
      // Extract filename from current URL or find a matching image
      const filename = extractFilenameOrGetRandom(img.image_url, imageFiles);
      
      if (uploadedUrls.has(filename)) {
        const blobUrl = uploadedUrls.get(filename);
        
        // Update the database
        const updateQuery = `
          UPDATE property_images
          SET image_url = $1, updated_at = NOW()
          WHERE id = $2
        `;
        
        await client.query(updateQuery, [blobUrl, img.id]);
        console.log(`   ✓ Image updated: ${filename} -> ${blobUrl.substring(0, 50)}...`);
        imagesUpdatedCount++;
      } else {
        console.log(`   ⚠ No blob URL found for ${filename}`);
      }
    }
    
    console.log(`\n✅ Successfully updated ${imagesUpdatedCount} image records!`);
    console.log(`📊 Summary:`);
    console.log(`   - Images uploaded to blob: ${imagesUploadedCount}`);
    console.log(`   - Property images updated: ${imagesUpdatedCount}`);
    console.log(`   - Properties affected: ${newProperties.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

function extractFilenameOrGetRandom(imageUrl, availableFiles) {
  // Try to extract filename from URL paths
  if (imageUrl) {
    // Handle Vercel blob URLs: https://xxx.blob.vercel-storage.com/FILENAME
    const blobMatch = imageUrl.match(/\/([^\/]+\.(?:jpg|jpeg|png|gif|webp))$/i);
    if (blobMatch && availableFiles.includes(blobMatch[1])) {
      return blobMatch[1];
    }
    
    // Handle local paths: /data/images/FILENAME
    const localMatch = imageUrl.match(/\/([^\/]+\.(?:jpg|jpeg|png|gif|webp))$/i);
    if (localMatch && availableFiles.includes(localMatch[1])) {
      return localMatch[1];
    }
  }
  
  // Fallback: return first available image
  return availableFiles[0];
}

main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
