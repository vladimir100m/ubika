import Redis from 'ioredis';
import { cacheMetrics } from './cacheMetrics';

const redisUrl = process.env.ubika_cache_REDIS_URL || process.env.UBIKA_CACHE_REDIS_URL || process.env.REDIS_URL;

type CacheValue = string | object;

let client: Redis | null = null;

if (redisUrl) {
  client = new Redis(redisUrl);
  client.on('error', (err) => {
    console.error('Redis error', err);
    cacheMetrics.recordError('get');
    cacheMetrics.recordError('set');
  });
  client.on('connect', () => console.log('Redis connected'));
} else {
  console.warn('Redis URL not set — cache will use in-memory fallback (not persistent).');
}

// Simple in-memory fallback for local development
const inMemoryStore = new Map<string, string>();

export const cacheSet = async (key: string, value: CacheValue, ttlSeconds?: number): Promise<void> => {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  if (client) {
    if (ttlSeconds) await client.set(key, serialized, 'EX', ttlSeconds);
    else await client.set(key, serialized);
    console.log(`[CACHE] SET: ${key} (TTL: ${ttlSeconds || 'none'})`);
    return;
  }
  inMemoryStore.set(key, serialized);
  console.log(`[CACHE] SET (in-memory): ${key} (TTL: ${ttlSeconds || 'none'})`);
  if (ttlSeconds) {
    setTimeout(() => {
      inMemoryStore.delete(key);
      console.log(`[CACHE] EXPIRED: ${key}`);
    }, ttlSeconds * 1000);
  }
};

export const cacheGet = async <T = any>(key: string, ageInSeconds?: number): Promise<T | null> => {
  let val: string | null = null;
  try {
    if (client) {
      val = await client.get(key);
    } else {
      val = inMemoryStore.get(key) ?? null;
    }
  } catch (e) {
    console.error(`[CACHE] GET error for ${key}:`, e);
    cacheMetrics.recordError('get');
    return null;
  }

  if (!val) {
    console.log(`[CACHE] MISS: ${key}`);
    cacheMetrics.recordMiss();
    return null;
  }
  console.log(`[CACHE] HIT: ${key}`);
  cacheMetrics.recordHit(ageInSeconds);
  try {
    return JSON.parse(val) as T;
  } catch (e) {
    console.error(`[CACHE] Parse error for ${key}:`, e);
    return (val as unknown) as T;
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  try {
    if (client) {
      const result = await client.del(key);
      console.log(`[CACHE] DEL: ${key} (deleted: ${result})`);
      cacheMetrics.recordDelete();
      return;
    }
    const existed = inMemoryStore.has(key);
    inMemoryStore.delete(key);
    console.log(`[CACHE] DEL (in-memory): ${key} (existed: ${existed})`);
    cacheMetrics.recordDelete();
  } catch (e) {
    console.error(`[CACHE] DELETE error for ${key}:`, e);
    cacheMetrics.recordError('delete');
  }
};

/**
 * Invalidate all cache keys matching a pattern using SCAN
 * This is useful for clearing related caches (e.g., all properties for a seller)
 * @param pattern - Pattern to match (e.g., "seller:*" or "property:*")
 */
export const cacheInvalidatePattern = async (pattern: string): Promise<void> => {
  const startTime = Date.now();
  let deletedCount = 0;

  if (!client) {
    // In-memory fallback: iterate and delete matching keys
    const keysToDelete: string[] = [];
    // Convert glob pattern to regex: "v1:seller:*" -> "v1:seller:.*"
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of Array.from(inMemoryStore.keys())) {
      if (regexPattern.test(key)) {
        keysToDelete.push(key);
        console.log(`[CACHE] Marking for deletion: ${key}`);
      }
    }
    deletedCount = keysToDelete.length;
    console.log(`[CACHE] Pattern "${pattern}" matched ${deletedCount} keys`);
    keysToDelete.forEach(key => inMemoryStore.delete(key));
    cacheMetrics.recordPatternInvalidation();
    return;
  }

  try {
    // Use SCAN to find all keys matching the pattern
    let cursor = '0';
    const keysToDelete: string[] = [];

    do {
      const [newCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = newCursor;
      keysToDelete.push(...keys);
    } while (cursor !== '0');

    deletedCount = keysToDelete.length;
    if (keysToDelete.length > 0) {
      console.log(`[CACHE] Pattern "${pattern}" matched ${deletedCount} keys in Redis (took ${Date.now() - startTime}ms)`);
      await client.del(...keysToDelete);
    }
    cacheMetrics.recordPatternInvalidation();
  } catch (e) {
    console.error(`[CACHE] ERROR invalidating pattern "${pattern}":`, e);
    cacheMetrics.recordError('pattern');
  }
};

export const cacheClient = client;

export default {
  set: cacheSet,
  get: cacheGet,
  del: cacheDel,
  invalidatePattern: cacheInvalidatePattern,
  client: cacheClient,
};
