// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
import { cacheSet, cacheGet, cacheDel } from '../src/lib/cache';
import { cacheSession, getCachedSession, deleteCachedSession } from '../src/lib/sessionCache';

describe('sessionCache helpers (in-memory fallback)', () => {
  beforeEach(async () => {
    await cacheDel('test:user');
    await deleteCachedSession('test:user');
  });

  it('caches session objects and retrieves them', async () => {
    const session = { user: { sub: 'test:user', email: 'u@example.com' }, expires: 'never' };
    await cacheSession('test:user', session, 2);
    const cached = await getCachedSessionOnly('test:user');
    expect(cached).toEqual(session);
  });

  it('deletes cached session', async () => {
    const session = { user: { sub: 'test:user' } };
    await cacheSession('test:user', session);
    await deleteCachedSession('test:user');
    const cached = await getCachedSessionOnly('test:user');
    expect(cached).toBeNull();
  });
});
