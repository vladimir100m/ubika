// Shared Redis env resolution for scripts and server (CommonJS)
function getRedisUrl() {
  return (
    process.env.VERCEL_REDIS_URL ||
    process.env.VERCEL_REDIS ||
    process.env.ubika_cache_REDIS_URL ||
    process.env.UBIKA_CACHE_REDIS_URL ||
    process.env.REDIS_URL ||
    process.env.REDIS ||
    null
  )
}

module.exports = { getRedisUrl }
