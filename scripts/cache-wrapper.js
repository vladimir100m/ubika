// Lightweight cache wrapper for scripts (CommonJS)
const Redis = require('ioredis')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const { getRedisUrl } = require('./cache-env')
const redisUrl = getRedisUrl()

let _client = null
const inMemoryStore = new Map()

function createClient() {
  if (!_client && redisUrl) {
    _client = new Redis(redisUrl)
    _client.on('connect', () => console.log('[cache-wrapper] Redis connected'))
    _client.on('error', (e) => console.error('[cache-wrapper] Redis error', e && e.message))
  }
  return _client
}

function getClient() {
  return _client || (redisUrl ? createClient() : null)
}

async function set(key, value, ttlSeconds) {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value)
  const client = getClient()
  if (client) {
    if (ttlSeconds) await client.set(key, serialized, 'EX', ttlSeconds)
    else await client.set(key, serialized)
    return
  }
  inMemoryStore.set(key, serialized)
  if (ttlSeconds) setTimeout(() => inMemoryStore.delete(key), ttlSeconds * 1000)
}

async function get(key) {
  const client = getClient()
  if (client) return client.get(key)
  return inMemoryStore.get(key) ?? null
}

async function del(key) {
  const client = getClient()
  if (client) return client.del(key)
  const existed = inMemoryStore.has(key)
  inMemoryStore.delete(key)
  return existed ? 1 : 0
}

async function invalidatePattern(pattern) {
  const client = getClient()
  if (!client) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    for (const k of Array.from(inMemoryStore.keys())) if (regex.test(k)) inMemoryStore.delete(k)
    return
  }
  let cursor = '0'
  const keysToDelete = []
  do {
    const [newCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
    cursor = newCursor
    keysToDelete.push(...keys)
  } while (cursor !== '0')
  if (keysToDelete.length > 0) await client.del(...keysToDelete)
}

function _cleanup() {
  if (_client && typeof _client.quit === 'function') {
    try { _client.quit() } catch (e) { /* ignore */ }
    _client = null
  }
}
process.on('exit', _cleanup)
process.on('SIGINT', () => { _cleanup(); process.exit(0) })
process.on('SIGTERM', () => { _cleanup(); process.exit(0) })

module.exports = {
  get client() { return getClient() },
  set,
  get,
  del,
  invalidatePattern,
  keys: async (pattern) => {
    const client = getClient()
    if (client) return client.keys(pattern)
    return Array.from(inMemoryStore.keys()).filter(k => k.match(new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')))
  },
  scanStream: (opts) => {
    const client = getClient()
    return client ? client.scanStream(opts) : { [Symbol.asyncIterator]: async function* () { } }
  },
  dbsize: async () => {
    const client = getClient()
    return client ? client.dbsize() : inMemoryStore.size
  },
  flushdb: async () => {
    const client = getClient()
    return client ? client.flushdb() : (inMemoryStore.clear(), null)
  },
  connect: async () => {
    const client = getClient()
    return client ? client.connect() : null
  },
  disconnect: async () => {
    if (_client && typeof _client.disconnect === 'function') return _client.disconnect()
    return null
  },
  quit: async () => {
    if (_client && typeof _client.quit === 'function') {
      try { await _client.quit() } catch (e) { /* ignore */ }
      _client = null
    }
    return null
  },
}
