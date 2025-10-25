#!/usr/bin/env node

/**
 * Create fictional properties and assign them to a specific seller
 * Usage: node scripts/create-properties-for-seller.js <seller_id>
 * If no seller_id provided, uses TEST_SELLER_ID
 */

const fs = require('fs');
const path = require('path');
const pkg = require('pg');
const { Pool } = pkg;
const Redis = require('ioredis');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const redis = new Redis(process.env.REDIS_URL);

// Configuration
const IMAGES_DIR = path.resolve(__dirname, '../data/images');
const NUM_PROPERTIES = 10;
const IMAGES_PER_PROPERTY = 3;

// Default seller ID - can be overridden via command line
const SELLER_ID = process.argv[2] || 'test-seller-001';

// Property types
const PROPERTY_TYPES = ['House', 'Apartment', 'Condo', 'Townhouse', 'Villa'];

// Sample cities and streets
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
const STREETS = ['Oak', 'Maple', 'Birch', 'Elm', 'Spring', 'Summer', 'Sunset', 'Main', 'Park', 'Garden'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPrice() {
  return getRandomInt(150000, 1500000);
}

function generatePropertyData(index) {
  const bedrooms = getRandomInt(1, 5);
  const bathrooms = getRandomInt(1, 4);
  const squareMeters = getRandomInt(80, 400);
  const yearBuilt = getRandomInt(1980, 2023);
  const street = `${getRandomInt(100, 9999)} ${getRandomElement(STREETS)} Road`;
  const city = getRandomElement(CITIES);
  const state = 'State';
  const country = 'Country';
  const zipCode = String(getRandomInt(10000, 99999));

  return {
    title: `${getRandomElement(PROPERTY_TYPES)} at ${street}`,
    description: `Beautiful ${bedrooms} bedroom, ${bathrooms} bathroom property in ${city}. ${squareMeters}m² living space built in ${yearBuilt}.`,
    address: street,
    city,
    state,
    country,
    zipCode,
    type: getRandomElement(PROPERTY_TYPES),
    bedrooms,
    bathrooms,
    squareMeters,
    yearBuilt,
    price: getRandomPrice(),
  };
}

async function getAvailableImages() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.warn(`⚠️  Images directory not found: ${IMAGES_DIR}`);
    return [];
  }

  const files = fs.readdirSync(IMAGES_DIR);
  return files.filter((f) => /\.(jpg|jpeg|png|gif)$/i.test(f));
}

async function createProperty(client, propertyData, sellerId) {
  const query = `
    INSERT INTO properties (
      title, description, price, address, city, state, country, zip_code,
      type, room, bathrooms, square_meters, year_built, seller_id, status,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
    RETURNING id
  `;

  const values = [
    propertyData.title,
    propertyData.description,
    propertyData.price,
    propertyData.address,
    propertyData.city,
    propertyData.state,
    propertyData.country,
    propertyData.zipCode,
    propertyData.type,
    propertyData.bedrooms,
    propertyData.bathrooms,
    propertyData.squareMeters,
    propertyData.yearBuilt,
    sellerId,
    'active',
  ];

  const res = await client.query(query, values);
  return res.rows[0].id;
}

async function addImagesToProperty(client, propertyId, imageFiles) {
  if (imageFiles.length === 0) return 0;

  const imagesToUse = imageFiles.slice(0, IMAGES_PER_PROPERTY);
  let addedCount = 0;

  for (let i = 0; i < imagesToUse.length; i++) {
    const filename = imagesToUse[i];
    const imageUrl = `/data/images/${filename}`;

    const query = `
      INSERT INTO property_images (property_id, image_url, is_cover, display_order, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `;

    await client.query(query, [propertyId, imageUrl, i === 0, i]);
    addedCount++;
  }

  return addedCount;
}

async function createFictionalProperties() {
  const client = await pool.connect();
  try {
    console.log(`\n🏗️  Creating Fictional Properties\n`);
    console.log(`📊 Configuration:`);
    console.log(`   Properties: ${NUM_PROPERTIES}`);
    console.log(`   Images per property: ${IMAGES_PER_PROPERTY}`);
    console.log(`   Seller ID: ${SELLER_ID}\n`);

    // Get available images
    const imageFiles = await getAvailableImages();
    console.log(`📷 Found ${imageFiles.length} image files`);
    if (imageFiles.length > 0) {
      console.log(`   ${imageFiles.slice(0, 5).join(', ')}${imageFiles.length > 5 ? '...' : ''}\n`);
    }

    let totalImages = 0;
    const createdProperties = [];

    for (let i = 0; i < NUM_PROPERTIES; i++) {
      const propertyData = generatePropertyData(i);

      // Create property
      const propertyId = await createProperty(client, propertyData, SELLER_ID);
      createdProperties.push({ id: propertyId, title: propertyData.title });

      // Add images
      const imagesAdded = await addImagesToProperty(client, propertyId, imageFiles);
      totalImages += imagesAdded;

      console.log(`${i + 1}. ✓ ${propertyData.title}`);
      console.log(`   ID: ${propertyId} | Images: ${imagesAdded}`);
    }

    // Clear relevant cache patterns
    console.log(`\n🔄 Clearing cache...\n`);
    const cachePatterns = ['v1:properties:*', 'v1:seller:*', 'v1:property:*', 'cache:*'];
    let clearedCount = 0;

    for (const pattern of cachePatterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        clearedCount += keys.length;
      }
    }

    console.log(`✓ Cleared ${clearedCount} cache keys\n`);

    // Summary
    console.log(`📊 Summary:`);
    console.log(`   ✓ Properties created: ${NUM_PROPERTIES}`);
    console.log(`   ✓ Images added: ${totalImages}`);
    console.log(`   ✓ Cache cleared: ${clearedCount} keys\n`);

    console.log(`💡 Next steps:`);
    console.log(`   1. Make sure you're logged in on http://localhost:3000`);
    console.log(`   2. Get your user ID: http://localhost:3000/api/debug/current-user`);
    console.log(`   3. Reassign properties: node scripts/reassign-properties.js ${SELLER_ID} YOUR_USER_ID`);
    console.log(`   4. Visit http://localhost:3000/seller to see your properties\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    redis.disconnect();
  }
}

createFictionalProperties();
