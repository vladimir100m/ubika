#!/usr/bin/env node
/**
 * Test script to create ONE fictional property
 * For validation before running the full batch
 * 
 * Usage: node scripts/test-create-property.js
 */

const fs = require('fs');
const path = require('path');
const pkg = require('pg');
const { Pool } = pkg;

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
const IMAGES_DIR = path.resolve(__dirname, '../data/images');

console.log('🔍 Environment check:');
console.log(`✓ DATABASE_URL: ${DATABASE_URL ? '✓ Configured' : '✗ Missing'}`);
console.log(`✓ IMAGES_DIR: ${IMAGES_DIR}`);
console.log(`✓ Images directory exists: ${fs.existsSync(IMAGES_DIR)}`);

if (fs.existsSync(IMAGES_DIR)) {
  const images = fs.readdirSync(IMAGES_DIR);
  console.log(`✓ Images found: ${images.length}`);
  images.forEach(img => console.log(`  - ${img}`));
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not configured!');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  const client = await pool.connect();
  try {
    console.log('\n📡 Testing database connection...');
    const timeResult = await client.query('SELECT NOW()');
    console.log('✓ Database connection successful!');
    console.log(`✓ Current time: ${timeResult.rows[0].now}`);
    
    // Check if properties table exists
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'properties'
      )
    `);
    
    if (!checkTable.rows[0].exists) {
      console.error('❌ properties table does not exist!');
      process.exit(1);
    }
    console.log('✓ properties table exists');
    
    // Check if property_images table exists
    const checkImages = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'property_images'
      )
    `);
    
    if (!checkImages.rows[0].exists) {
      console.error('❌ property_images table does not exist!');
      process.exit(1);
    }
    console.log('✓ property_images table exists');
    
    // Create one test property
    console.log('\n🏠 Creating test property...');
    const testProperty = {
      title: 'Beautiful Test Property in New York',
      description: 'This is a test property created by the validation script.',
      price: 450000,
      address: '123 Test Avenue',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zip_code: '10001',
      type: 'house',
      bedrooms: 3,
      bathrooms: 2,
      sq_meters: 250,
      year_built: 2020,
      seller_id: 'test_user_001',
      operation_status_id: 1,
      status: 'available'
    };
    
    const insertQuery = `
      INSERT INTO properties (
        title, description, price, address, city, state, country, zip_code,
        type, room, bathrooms, square_meters, year_built, seller_id,
        operation_status_id, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING id, title, address, city, price
    `;
    
    const values = [
      testProperty.title,
      testProperty.description,
      testProperty.price,
      testProperty.address,
      testProperty.city,
      testProperty.state,
      testProperty.country,
      testProperty.zip_code,
      testProperty.type,
      testProperty.bedrooms,
      testProperty.bathrooms,
      testProperty.sq_meters,
      testProperty.year_built,
      testProperty.seller_id,
      testProperty.operation_status_id,
      testProperty.status
    ];
    
    const result = await client.query(insertQuery, values);
    const createdProp = result.rows[0];
    console.log(`✓ Property created successfully!`);
    console.log(`  ID: ${createdProp.id}`);
    console.log(`  Title: ${createdProp.title}`);
    console.log(`  Address: ${createdProp.address}, ${createdProp.city}`);
    console.log(`  Price: $${createdProp.price}`);
    
    // Try to add an image if available
    const images = fs.readdirSync(IMAGES_DIR);
    if (images.length > 0) {
      console.log(`\n📷 Adding test image...`);
      const testImage = images[0];
      const imageQuery = `
        INSERT INTO property_images (property_id, image_url, is_cover, display_order, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, image_url, is_cover
      `;
      
      const imgResult = await client.query(imageQuery, [
        createdProp.id,
        `/data/images/${testImage}`,
        true,
        0
      ]);
      
      const addedImage = imgResult.rows[0];
      console.log(`✓ Image added successfully!`);
      console.log(`  Image URL: ${addedImage.image_url}`);
      console.log(`  Is Cover: ${addedImage.is_cover}`);
    }
    
    console.log('\n✅ All validations passed! Script is ready for production use.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

testConnection();
