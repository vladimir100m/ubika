#!/usr/bin/env node
const cache = require('./cache-wrapper')

const keysToClear = [
  'property-types:list',
  'property-statuses:list',
  'property-operation-statuses:list',
]

;(async () => {
  try {
    const r = await cache.del(...keysToClear)
    console.log(`Cleared ${r || 0} cache keys.`)
    if (cache.quit) await cache.quit()
  } catch (e) {
    console.error('Error clearing cache:', e && e.message)
    process.exit(1)
  }
})()
