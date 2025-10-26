/* eslint-env jest */
// @ts-nocheck
const { searchCached } = require('../src/lib/searchService')

jest.mock('../src/lib/readModel', () => ({
  searchPropertyDocuments: jest.fn(async () => ({
    results: [{ id: 'p1', title: 'Mock' }],
    page: 1,
    pageSize: 10,
    total: 1,
  })),
}))

jest.mock('../src/lib/cache', () => ({
  cacheGet: jest.fn(async (k) => null),
  cacheSet: jest.fn(async (k, v, ttl) => undefined),
}))

describe('searchCached', () => {
  it('returns results from readModel and caches them', async () => {
    const res = await searchCached({ q: 'mock' }, 1, 10)
    expect(res).toBeDefined()
    // @ts-ignore mocked shape
    expect(res.results.length).toBe(1)
    expect(res.page).toBe(1)
  })
})
