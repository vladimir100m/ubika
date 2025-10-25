#!/usr/bin/env node

/**
 * Master script: Complete setup for seller view
 * - Clear database
 * - Create properties
 * - Clear cache
 * - Show next steps
 */

const { exec } = require('child_process');
const path = require('path');

function runCommand(cmd, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n⏳ ${description}...`);
    exec(cmd, { cwd: path.resolve(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Failed: ${error.message}`);
        reject(error);
      } else {
        console.log(`✅ ${description} complete`);
        resolve(stdout);
      }
    });
  });
}

async function setup() {
  try {
    console.log('\n🚀 Setting Up Seller View - Complete Workflow\n');
    console.log('This will:');
    console.log('  1. Clear all database data');
    console.log('  2. Create 10 test properties');
    console.log('  3. Clear Redis cache');
    console.log('  4. Show you how to view properties\n');

    // Step 1: Clear database
    await runCommand('echo "YES" | node scripts/clear-database.js', 'Clearing database');

    // Step 2: Create properties
    await runCommand('node scripts/create-properties-for-seller.js', 'Creating test properties');

    // Step 3: Clear cache
    await runCommand('node scripts/clear-all-cache.js', 'Clearing cache');

    console.log('\n' + '='.repeat(60));
    console.log('✅ SETUP COMPLETE!');
    console.log('='.repeat(60));

    console.log('\n📋 Your Properties Are Ready!');
    console.log('   - 10 test properties created');
    console.log('   - Images assigned from /data/images');
    console.log('   - Database cleared and refreshed');
    console.log('   - Cache cleared for fresh data\n');

    console.log('🔑 To View Properties in Seller Dashboard:\n');
    console.log('1️⃣  Get your Google user ID (you must be logged in):');
    console.log('    http://localhost:3000/api/debug/current-user\n');

    console.log('2️⃣  Assign properties to your user:');
    console.log('    node scripts/reassign-properties.js test-seller-001 YOUR_USER_ID\n');

    console.log('3️⃣  Open seller dashboard:');
    console.log('    http://localhost:3000/seller\n');

    console.log('💡 Example:');
    console.log('   node scripts/reassign-properties.js test-seller-001 102718398123456789\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup();
