/* eslint-env jest */
// @ts-nocheck

// Mock ioredis and verify cache uses the Redis-path (scan/del/set/get)
jest.resetModules()

const store = new Map<string, string>()

const mockClient: any = {
  on: jest.fn(),
  set: jest.fn(async (key: string, val: string, ...args: any[]) => {
    store.set(key, val)
    return 'OK'
  }),
  get: jest.fn(async (key: string) => store.get(key) ?? null),
  del: jest.fn(async (...keys: string[]) => {
    let deleted = 0
    keys.forEach((k) => { if (store.delete(k)) deleted++ })
    return deleted
  }),
  scan: jest.fn(async (_cursor: string, _matchCmd: string, pattern: string, _countCmd: string, _count: number) => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    const keys = Array.from(store.keys()).filter(k => regex.test(k))
    return ['0', keys]
  }),
}

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockClient)
})

describe('cache Redis-path', () => {
  beforeEach(() => {
    jest.resetModules()
    store.clear()
    // ensure cache module will create a client
    process.env.REDIS_URL = 'redis://localhost:6379'
  })

  it('uses Redis client for set/get/del', async () => {
    const cache = require('../src/lib/cache')
    await cache.cacheSet('r:one', { a: 1 })
    expect(mockClient.set).toHaveBeenCalled()
    const got = await cache.cacheGet('r:one')
    expect(got).toEqual({ a: 1 })
    await cache.cacheDel('r:one')
    expect(mockClient.del).toHaveBeenCalled()
    const after = await cache.cacheGet('r:one')
    expect(after).toBeNull()
  })

  it('cacheInvalidatePattern uses SCAN and DEL on Redis', async () => {
    const cache = require('../src/lib/cache')
    await cache.cacheSet('v1:prop:1', { id: 1 })
    await cache.cacheSet('v1:prop:2', { id: 2 })
    await cache.cacheSet('v1:other:3', { id: 3 })

    await cache.cacheInvalidatePattern('v1:prop:*')

    expect(mockClient.scan).toHaveBeenCalled()
    expect(mockClient.del).toHaveBeenCalled()
    expect(await cache.cacheGet('v1:prop:1')).toBeNull()
    expect(await cache.cacheGet('v1:prop:2')).toBeNull()
    expect(await cache.cacheGet('v1:other:3')).not.toBeNull()
  })
})
