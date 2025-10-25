#!/usr/bin/env node
const Redis = require('ioredis');

const redisUrl = process.env.ubika_cache_REDIS_URL || process.env.UBIKA_CACHE_REDIS_URL || process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('Redis URL not set. Cannot clear cache.');
  process.exit(0);
}

const client = new Redis(redisUrl);

const keysToClear = [
  'property-types:list',
  'property-statuses:list',
  'property-operation-statuses:list',
];

client.del(keysToClear, (err, result) => {
  if (err) {
    console.error('Error clearing cache:', err);
    process.exit(1);
  }
  console.log(`Cleared ${result} cache keys.`);
  client.quit();
});
