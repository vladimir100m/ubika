import { cacheClient } from './cache'

// Serverless-safe rate limiter using Redis INCR + EXPIRE with an in-memory fallback.
// Returns true if the action is allowed, false if rate limit exceeded.

type InMemoryEntry = { count: number; expiresAt: number }
const inMemoryStore = new Map<string, InMemoryEntry>()

export async function rateLimit(key: string, maxRequests = 60, windowSeconds = 60): Promise<boolean> {
  const client: any = cacheClient
  try {
    if (client) {
      // Atomic INCR + EXPIRE pattern
      const val = await client.incr(key)
      if (val === 1) {
        // best-effort expiry set
        try { await client.expire(key, windowSeconds) } catch (e) {}
      }
      return val <= maxRequests
    }
  } catch (e) {
    // fall through to in-memory fallback
    // eslint-disable-next-line no-console
    console.warn('[rateLimit] Redis error, falling back to in-memory', e && e.message)
  }

  // In-memory fallback (per-process; resets on restart)
  const now = Date.now()
  const entry = inMemoryStore.get(key)
  if (!entry || entry.expiresAt <= now) {
    inMemoryStore.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 })
    return true
  }
  entry.count += 1
  inMemoryStore.set(key, entry)
  return entry.count <= maxRequests
}

export default rateLimit
