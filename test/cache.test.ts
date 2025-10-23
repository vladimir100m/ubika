// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
import { cacheGet, cacheSet, cacheDel } from '../src/lib/cache';

describe('cache (in-memory fallback)', () => {
  beforeEach(async () => {
    // clear keys used in tests
    await cacheDel('test:key');
    await cacheDel('test:object');
  });

  it('sets and gets a string value', async () => {
    await cacheSet('test:key', 'value', 1);
    const v = await cacheGet<string>('test:key');
    expect(v).toBe('value');
  });

  it('sets and gets an object value', async () => {
    const obj = { a: 1, b: 'two' };
    await cacheSet('test:object', obj, 1);
    const got = await cacheGet<Record<string, any>>('test:object');
    expect(got).toEqual(obj);
  });

  it('deletes a key', async () => {
    await cacheSet('test:key', 'value');
    await cacheDel('test:key');
    const v = await cacheGet('test:key');
    expect(v).toBeNull();
  });
});
