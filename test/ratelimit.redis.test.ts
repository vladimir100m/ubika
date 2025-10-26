/* eslint-env jest */
// @ts-nocheck

jest.resetModules()

// Simple mock Redis for incr/expire
const counters = new Map<string, number>()
const mockClient: any = {
  on: jest.fn(),
  incr: jest.fn(async (key: string) => {
    const v = (counters.get(key) || 0) + 1
    counters.set(key, v)
    return v
  }),
  expire: jest.fn(async (key: string, seconds: number) => 1),
}

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockClient)
})

describe('rateLimit Redis-path', () => {
  beforeEach(() => {
    jest.resetModules()
    counters.clear()
    process.env.REDIS_URL = 'redis://localhost:6379'
  })

  it('allows up to maxRequests and then blocks', async () => {
    const { rateLimit } = require('../src/lib/ratelimit')
    const key = 'rl:test'
    const a = await rateLimit(key, 2, 60)
    expect(a).toBe(true)
    const b = await rateLimit(key, 2, 60)
    expect(b).toBe(true)
    const c = await rateLimit(key, 2, 60)
    expect(c).toBe(false)
    // ensure underlying Redis commands were called
    expect(mockClient.incr).toHaveBeenCalled()
    expect(mockClient.expire).toHaveBeenCalled()
  })
})
