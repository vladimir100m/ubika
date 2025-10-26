/* eslint-env jest */
// Force ts-jest/commonjs module handling by using require() after resetModules

describe('cache integration (in-memory fallback)', () => {
  beforeEach(() => {
    // Ensure module picks up no REDIS so it uses in-memory fallback
    delete process.env.REDIS_URL
    delete process.env.VERCEL_REDIS_URL
    jest.resetModules()
  })

  it('cacheSet, cacheGet and cacheDel work (in-memory)', async () => {
    const cache = require('../src/lib/cache')
    await cache.cacheSet('test:ci:key1', { a: 1 })
    const got = await cache.cacheGet('test:ci:key1')
    expect(got).toEqual({ a: 1 })
    await cache.cacheDel('test:ci:key1')
    const after = await cache.cacheGet('test:ci:key1')
    expect(after).toBeNull()
  })

  it('cacheInvalidatePattern removes matching keys', async () => {
    const cache = require('../src/lib/cache')
    await cache.cacheSet('v1:prop:1', { id: 1 })
    await cache.cacheSet('v1:prop:2', { id: 2 })
    await cache.cacheSet('v1:other:3', { id: 3 })

    await cache.cacheInvalidatePattern('v1:prop:*')

    expect(await cache.cacheGet('v1:prop:1')).toBeNull()
    expect(await cache.cacheGet('v1:prop:2')).toBeNull()
    expect(await cache.cacheGet('v1:other:3')).not.toBeNull()
  })
})
