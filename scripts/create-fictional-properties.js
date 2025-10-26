#!/usr/bin/env node
/**
 * Script to create fictional properties with random images
 * Creates 10 properties (5 for each of 2 users)
 * 
 * Usage: node scripts/create-fictional-properties.js
 */

const fs = require('fs');
const path = require('path');
const pkg = require('pg');
const { Pool } = pkg;
const cache = require('./cache-wrapper')

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Configuration
const DATABASE_URL = process.env.DATABASE_URL;
const IMAGES_DIR = path.resolve(__dirname, '../data/images');
const NUM_PROPERTIES_PER_USER = 5;
const NUM_USERS = 2;

// Sample data for fictional properties
const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
  'Austin', 'Denver', 'Seattle', 'Boston', 'Miami'
];

const STATES = [
  'NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA',
  'TX', 'CO', 'WA', 'MA', 'FL'
];

const PROPERTY_TYPES = ['House', 'Apartment', 'Condo', 'Townhouse', 'Villa'];

const DESCRIPTIONS = [
  'Beautiful modern property with stunning views and exceptional finishes.',
  'Well-maintained home in a prime location with excellent access to amenities.',
  'Spacious property featuring modern updates and classic character.',
  'Charming residence with potential for personalization in a great neighborhood.',
  'Contemporary property with open floor plan and high-end features.',
  'Elegant home offering comfort and convenience in a desirable area.',
  'Property in excellent condition with professional landscaping and outdoor space.',
  'Prime location with proximity to schools, shopping, and entertainment.',
];

const STREET_NAMES = [
  'Main Street', 'Oak Avenue', 'Pine Road', 'Elm Drive', 'Cedar Lane',
  'Maple Court', 'Birch Boulevard', 'Ash Avenue', 'Walnut Way', 'Willow Road',
  'Oak Ridge Drive', 'Sunrise Lane', 'Sunset Boulevard', 'Spring Road', 'Summer Lane'
];

// User IDs (simulating seller_ids)
const USER_IDS = [
  'user_602b1234567890abcdef1234',
  'user_602b1234567890abcdef5678'
];

// Initialize PostgreSQL pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper functions
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPrice() {
  return getRandomInt(150000, 1500000);
}

function getRandomBedrooms() {
  return getRandomInt(1, 5);
}

function getRandomBathrooms() {
  return getRandomInt(1, 4);
}

function getRandomSquareMeters() {
  return getRandomInt(80, 400);
}

function getRandomYearBuilt() {
  return getRandomInt(1980, 2023);
}

function getRandomAddress() {
  const streetNum = getRandomInt(100, 9999);
  const streetName = getRandomElement(STREET_NAMES);
  return `${streetNum} ${streetName}`;
}

function getRandomZipCode() {
  return String(getRandomInt(10000, 99999));
}

function getAvailableImages() {
  try {
    const files = fs.readdirSync(IMAGES_DIR);
    return files.filter(f => f.match(/\.(jpg|jpeg|png|gif)$/i));
  } catch (error) {
    console.error('Error reading images directory:', error.message);
    return [];
  }
}

function getRandomImages(availableImages, count = 3) {
  const images = [];
  const imagesCopy = [...availableImages];
  
  for (let i = 0; i < Math.min(count, imagesCopy.length); i++) {
    const idx = Math.floor(Math.random() * imagesCopy.length);
    images.push(imagesCopy.splice(idx, 1)[0]);
  }
  
  return images;
}

// Generate fictional property data
function generatePropertyData(userId, index) {
  const address = getRandomAddress();
  const city = getRandomElement(CITIES);
  const stateIdx = CITIES.indexOf(city);
  const state = STATES[stateIdx] || 'NY';
  
  return {
    title: `${PROPERTY_TYPES[index % PROPERTY_TYPES.length]} at ${address}`,
    description: getRandomElement(DESCRIPTIONS),
    price: getRandomPrice(),
    address: address,
    city: city,
    state: state,
    country: 'USA',
    zip_code: getRandomZipCode(),
    type: PROPERTY_TYPES[index % PROPERTY_TYPES.length].toLowerCase(),
    bedrooms: getRandomBedrooms(),
    bathrooms: getRandomBathrooms(),
    sq_meters: getRandomSquareMeters(),
    year_built: getRandomYearBuilt(),
    seller_id: userId,
    operation_status_id: 1, // For Sale
    status: 'available',
    geocode: JSON.stringify({
      lat: getRandomInt(25000, 49000) / 1000,
      lng: -(getRandomInt(66000, 125000) / 1000)
    })
  };
}

// Create property in database
async function createProperty(client, propertyData) {
  const query = `
    INSERT INTO properties (
      title, description, price, address, city, state, country, zip_code,
      type, room, bathrooms, square_meters, year_built, seller_id,
      operation_status_id, status, geocode, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
    RETURNING id, title, address, city, seller_id
  `;
  
  const values = [
    propertyData.title,
    propertyData.description,
    propertyData.price,
    propertyData.address,
    propertyData.city,
    propertyData.state,
    propertyData.country,
    propertyData.zip_code,
    propertyData.type,
    propertyData.bedrooms,
    propertyData.bathrooms,
    propertyData.sq_meters,
    propertyData.year_built,
    propertyData.seller_id,
    propertyData.operation_status_id,
    propertyData.status,
    propertyData.geocode
  ];
  
  const result = await client.query(query, values);
  return result.rows[0];
}

// Add images to property
async function addImagesToProperty(client, propertyId, imageFiles) {
  const queries = imageFiles.map((file, index) => ({
    text: `
      INSERT INTO property_images (property_id, image_url, is_cover, display_order, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, image_url, is_cover
    `,
    values: [
      propertyId,
      `/data/images/${file}`,
      index === 0, // First image is cover
      index
    ]
  }));
  
  const results = [];
  for (const q of queries) {
    const result = await client.query(q.text, q.values);
    results.push(result.rows[0]);
  }
  
  return results;
}

// Main execution
async function main() {
  const client = await pool.connect();
  let propertiesCreated = 0;
  let imagesAdded = 0;
  
  try {
    console.log('🏠 Starting fictional properties creation script...\n');
    
    // Check if images directory exists
    const availableImages = getAvailableImages();
    console.log(`📷 Available images found: ${availableImages.length}`);
    if (availableImages.length === 0) {
      console.warn('⚠️  No images found in data/images directory');
      console.warn('Continuing with property creation without images...\n');
    } else {
      availableImages.forEach(img => console.log(`   - ${img}`));
      console.log();
    }
    
    // Create properties for each user
    for (let userIdx = 0; userIdx < NUM_USERS; userIdx++) {
      const userId = USER_IDS[userIdx];
      console.log(`\n👤 Creating properties for User ${userIdx + 1} (${userId})...`);
      
      for (let propIdx = 0; propIdx < NUM_PROPERTIES_PER_USER; propIdx++) {
        try {
          // Generate property data
          const propertyData = generatePropertyData(userId, propIdx);
          
          // Create property
          const createdProperty = await createProperty(client, propertyData);
          console.log(`   ✓ Property #${propIdx + 1}: "${createdProperty.title}"`);
          console.log(`     ID: ${createdProperty.id} | ${createdProperty.address}, ${createdProperty.city}`);
          propertiesCreated++;
          
          // Add random images if available
          if (availableImages.length > 0) {
            const randomImages = getRandomImages(availableImages);
            const addedImages = await addImagesToProperty(client, createdProperty.id, randomImages);
            console.log(`     Added ${addedImages.length} images`);
            imagesAdded += addedImages.length;
          }
          
        } catch (error) {
          console.error(`   ✗ Error creating property #${propIdx + 1}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Script completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Properties created: ${propertiesCreated} / ${NUM_USERS * NUM_PROPERTIES_PER_USER}`);
    console.log(`   - Total images added: ${imagesAdded}`);
    
    // Clear Redis cache to refresh UI (via cache-wrapper)
    console.log('\n🔄 Clearing Redis cache...')
    try {
      const patterns = ['v1:properties:*', 'v1:seller:*', 'v1:property:*', 'cache:*']
      let cleared = 0
      for (const pattern of patterns) {
        try {
          const keys = await cache.keys(pattern)
          if (keys.length > 0) {
            await cache.del(...keys)
            cleared += keys.length
            console.log(`   ✓ Cleared ${keys.length} keys matching ${pattern}`)
          }
        } catch (e) {
          console.log(`   ⚠ Pattern ${pattern}: ${e.message}`)
        }
      }

      if (cache.disconnect) await cache.disconnect()
      console.log(`✓ Total cache entries cleared: ${cleared}`)
    } catch (cacheError) {
      console.warn('⚠️  Warning: Could not clear Redis cache:', cacheError.message)
      console.log('   Properties created in database - refresh UI manually or restart server')
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
