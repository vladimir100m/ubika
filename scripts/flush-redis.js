#!/usr/bin/env node
/**
 * Aggressive Redis Cache Cleaner
 * This script completely flushes the Redis database
 * 
 * Usage: node scripts/flush-redis.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

async function flushRedis() {
  console.log('🧹 Complete Redis Cache Flush\n');
  
  try {
    const cache = require('./cache-wrapper')
    const redis = cache.client

    if (!redis) {
      console.error('❌ REDIS_URL not found in .env.local');
      process.exit(1);
    }

    console.log('🔗 Connecting to Redis (via cache-wrapper)')

    // Get current database info
    const dbSize = await cache.dbsize()
    console.log(`📊 Current database contains ${dbSize} keys`);

    if (dbSize === 0) {
      console.log('✨ Database is already empty - nothing to clear');
      redis.disconnect();
      return;
    }

    // Show some existing keys for confirmation
    console.log('\n🔍 Sample keys before clearing:');
  const sampleKeys = await cache.keys('*');
    sampleKeys.slice(0, 10).forEach((key, index) => {
      console.log(`   ${index + 1}. ${key}`);
    });
    if (sampleKeys.length > 10) {
      console.log(`   ... and ${sampleKeys.length - 10} more keys`);
    }

    // Flush the entire database
    console.log('\n🚀 Flushing entire Redis database...');
  await cache.flushdb();

    // Verify the flush
  const newDbSize = await cache.dbsize();
    console.log(`✅ Database flushed successfully!`);
    console.log(`📊 Database now contains ${newDbSize} keys`);

    if (newDbSize === 0) {
      console.log('🎉 All cache entries have been completely cleared!');
      console.log('💡 The application will rebuild cache on next requests');
    } else {
      console.log('⚠️  Some keys might still exist (possibly persistent data)');
    }

  if (cache.disconnect) await cache.disconnect()
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure Redis server is running');
    }
    process.exit(1);
  }
}

flushRedis();