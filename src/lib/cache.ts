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
    return;
  }
  inMemoryStore.set(key, serialized);
  if (ttlSeconds) {
    setTimeout(() => inMemoryStore.delete(key), ttlSeconds * 1000);
  }
};

export const cacheGet = async <T = any>(key: string): Promise<T | null> => {
  let val: string | null = null;
  if (client) {
    val = await client.get(key);
  } else {
    val = inMemoryStore.get(key) ?? null;
  }
  if (!val) return null;
  try {
    return JSON.parse(val) as T;
  } catch (e) {
    return (val as unknown) as T;
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  if (client) {
    await client.del(key);
    return;
  }
  inMemoryStore.delete(key);
};

export const cacheClient = client;

export default {
  set: cacheSet,
  get: cacheGet,
  del: cacheDel,
  client: cacheClient,
};
