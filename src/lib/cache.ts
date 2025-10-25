import Redis from 'ioredis';

const redisUrl = process.env.ubika_cache_REDIS_URL || process.env.UBIKA_CACHE_REDIS_URL || process.env.REDIS_URL;

type CacheValue = string | object;

let client: Redis | null = null;

if (redisUrl) {
  client = new Redis(redisUrl);
  client.on('error', (err) => console.error('Redis error', err));
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

export const cacheGet = async <T = any>(key: string): Promise<T | null> => {
  let val: string | null = null;
  if (client) {
    val = await client.get(key);
  } else {
    val = inMemoryStore.get(key) ?? null;
  }
  if (!val) {
    console.log(`[CACHE] MISS: ${key}`);
    return null;
  }
  console.log(`[CACHE] HIT: ${key}`);
  try {
    return JSON.parse(val) as T;
  } catch (e) {
    return (val as unknown) as T;
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  if (client) {
    const result = await client.del(key);
    console.log(`[CACHE] DEL: ${key} (deleted: ${result})`);
    return;
  }
  const existed = inMemoryStore.has(key);
  inMemoryStore.delete(key);
  console.log(`[CACHE] DEL (in-memory): ${key} (existed: ${existed})`);
};

/**
 * Invalidate all cache keys matching a pattern using SCAN
 * This is useful for clearing related caches (e.g., all properties for a seller)
 * @param pattern - Pattern to match (e.g., "seller:*" or "property:*")
 */
export const cacheInvalidatePattern = async (pattern: string): Promise<void> => {
  if (!client) {
    // In-memory fallback: iterate and delete matching keys
    const keysToDelete: string[] = [];
    // Convert glob pattern to regex: "seller:*" -> "seller:.*"
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of Array.from(inMemoryStore.keys())) {
      if (regexPattern.test(key)) {
        keysToDelete.push(key);
        console.log(`[CACHE] Marking for deletion: ${key}`);
      }
    }
    console.log(`[CACHE] Pattern "${pattern}" matched ${keysToDelete.length} keys`);
    keysToDelete.forEach(key => inMemoryStore.delete(key));
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

    if (keysToDelete.length > 0) {
      console.log(`[CACHE] Pattern "${pattern}" matched ${keysToDelete.length} keys in Redis`);
      await client.del(...keysToDelete);
    }
  } catch (e) {
    console.error('Error invalidating cache pattern:', pattern, e);
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
