#!/usr/bin/env node
/**
 * Script to clear all Redis cache entries
 * Useful after batch operations to refresh UI
 * 
 * Usage: node scripts/clear-all-cache.js
 */

const Redis = require('ioredis');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

async function clearCache() {
  console.log('🔄 Redis Cache Clearing Tool\n');
  
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.warn('⚠️  REDIS_URL not configured in .env.local');
      console.warn('Using default localhost connection...');
    }

    const redis = new Redis(redisUrl || 'redis://localhost:6379', {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: null
    });

    redis.on('connect', () => console.log('✓ Connected to Redis'));
    redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
      process.exit(1);
    });

    // Wait for connection
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
      redis.on('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    console.log('Scanning cache patterns...\n');

    // Define cache patterns to clear
    const patterns = [
      'v1:properties:*',
      'v1:property:*',
      'v1:seller:*',
      'v1:zone:*',
      'v1:*',
      'cache:*',
      '*properties*'
    ];

    let totalCleared = 0;

    for (const pattern of patterns) {
      try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          totalCleared += keys.length;
          console.log(`✓ Cleared ${keys.length} keys matching pattern: ${pattern}`);
        }
      } catch (error) {
        if (!error.message.includes('Connection')) {
          console.warn(`⚠ Pattern ${pattern}: ${error.message}`);
        }
      }
    }

    // Also try FLUSHDB for aggressive clearing (optional)
    console.log('\n📊 Cache Statistics:');
    try {
      const info = await redis.dbsize();
      console.log(`Total keys remaining in database: ${info}`);
    } catch (e) {
      console.log('Could not retrieve cache statistics');
    }

    console.log(`\n✅ Successfully cleared ${totalCleared} cache entries!`);
    console.log('💡 UI should refresh on next page load');

    redis.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearCache();
