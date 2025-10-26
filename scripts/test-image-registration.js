#!/usr/bin/env node

/**
 * Test the image registration endpoint directly
 * Usage: node scripts/test-image-registration.js <property_id> <user_id>
 */

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function testRegistration() {
  const propertyId = process.argv[2];
  const userId = process.argv[3];

  if (!propertyId || !userId) {
    console.log('❌ Usage: node scripts/test-image-registration.js <property_id> <user_id>');
    console.log('\nExample:');
    console.log('  node scripts/test-image-registration.js 1a3b14c7-4faf-43d1-b02c-d28680c37b59 100296339400742202825');
    process.exit(1);
  }

  const testImageUrl = 'https://jwtwyxuclv3g8tta.public.blob.vercel-storage.com/ubika/AA001.jpg';

  console.log('🧪 Testing Image Registration\n');
  console.log('Configuration:');
  console.log(`  Property ID: ${propertyId}`);
  console.log(`  User ID: ${userId}`);
  console.log(`  Image URL: ${testImageUrl}\n`);

  try {
    console.log('📤 Sending registration request...\n');

    const response = await fetch('http://localhost:3000/api/properties/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        property_id: propertyId,
        image_url: testImageUrl,
        is_cover: true,
        display_order: 0,
      }),
      credentials: 'include', // Include cookies for session
    });

    const data = await response.json();

    console.log(`Response Status: ${response.status}`);
    console.log(`Response Headers:`);
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    console.log(`\nResponse Body:`);
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ SUCCESS! Image registered in database');
      console.log(`Image ID: ${data.id}`);
      console.log(`Property ID: ${data.property_id}`);
      console.log(`Image URL: ${data.image_url}`);
    } else {
      console.log('\n❌ FAILED!');
      console.log(`Error: ${data.error}`);
      if (data.details) {
        console.log(`Details: ${JSON.stringify(data.details, null, 2)}`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. Dev server is running (npm run dev)');
    console.log('2. You\'re logged in (check cookies)');
    console.log('3. Property ID exists in database');
    process.exit(1);
  }
}

testRegistration();
