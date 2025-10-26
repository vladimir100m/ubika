#!/usr/bin/env node
/**
 * Script to clear all Redis cache entries
 * Useful after batch operations to refresh UI
 * 
 * Usage: node scripts/clear-all-cache.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

async function clearCache() {
  console.log('🔄 Redis Cache Clearing Tool\n');
  
  try {
    const cache = require('./cache-wrapper')

    console.log('Scanning cache patterns...\n')

    // Define cache patterns to clear
    const patterns = [
      'v1:properties:*',
      'v1:property:*',
      'v1:seller:*',
      'v1:zone:*',
      'v1:*',
      'cache:*',
      '*properties*'
    ]

    let totalCleared = 0

    for (const pattern of patterns) {
      try {
        // Use keys for small dev sets; wrapper will return [] if Redis missing
        const keys = await cache.keys(pattern)
        if (keys.length > 0) {
          await cache.del(...keys)
          totalCleared += keys.length
          console.log(`✓ Cleared ${keys.length} keys matching pattern: ${pattern}`)
        }
      } catch (error) {
        if (!error.message.includes('Connection')) {
          console.warn(`⚠ Pattern ${pattern}: ${error.message}`)
        }
      }
    }

    // Also try FLUSHDB for aggressive clearing (optional)
    console.log('\n📊 Cache Statistics:');
    try {
      const info = await cache.dbsize()
      console.log(`Total keys remaining in database: ${info}`)
    } catch (e) {
      console.log('Could not retrieve cache statistics')
    }

    console.log(`\n✅ Successfully cleared ${totalCleared} cache entries!`);
    console.log('💡 UI should refresh on next page load');

  if (cache.disconnect) await cache.disconnect()
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearCache();
