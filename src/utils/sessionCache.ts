import { cacheGet, cacheSet, cacheDel } from './cache';

const DEFAULT_TTL = 86400; // 24 hours

const ttlFromEnv = (): number => {
  const raw = process.env.NEXTAUTH_SESSION_CACHE_TTL;
  if (!raw) return DEFAULT_TTL;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TTL;
};

export const cacheSession = async (subOrEmail: string, sessionObj: any, ttlSec?: number) => {
  const ttl = ttlSec ?? ttlFromEnv();
  const key = `session:${subOrEmail}`;
  await cacheSet(key, sessionObj, ttl);
};

export const getCachedSession = async (subOrEmail: string) => {
  const key = `session:${subOrEmail}`;
  return cacheGet(key) as Promise<any | null>;
};

export const deleteCachedSession = async (subOrEmail: string) => {
  const key = `session:${subOrEmail}`;
  return cacheDel(key);
};

export default { cacheSession, getCachedSession, deleteCachedSession };
