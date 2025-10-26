const { buildAndUpsert } = require('../src/lib/syncProperty')

test('sync_property_integration builds doc, upserts and invalidates cache', async () => {
  let upsertCalled = false
  let upsertArgs = null
  let cacheDelCalled = false
  let cacheInvalidateCalled = []

  const fakeUpsert = async (id, doc) => {
    upsertCalled = true
    upsertArgs = { id, doc }
    return null
  }

  const fakeCacheDel = async (key) => {
    cacheDelCalled = true
    return null
  }

  const fakeCacheInvalidate = async (pattern) => {
    cacheInvalidateCalled.push(pattern)
    return null
  }

  const fakeResolve = async (u) => u // identity

  const fakeCACHE_KEYS = { property: (id) => `property:${id}` }
  const fakeGetPatterns = (property) => [`properties:city:${property.city}`, `properties:seller:${property.seller_id}`]

  const property = {
    id: 'p-test-1',
    title: 'Test',
    description: 'desc',
    price: 100000,
    squareMeters: 50,
    city: 'Testville',
    seller_id: 'seller-1'
  }

  const images = [{ id: 'i1', image_url: 'https://example.com/1.jpg' }]
  const features = [{ id: 'f1', name: 'Pool' }]

  const res = await buildAndUpsert({
    property,
    images,
    features,
    resolveImageUrl: fakeResolve,
    upsertPropertyDocument: fakeUpsert,
    cacheDel: fakeCacheDel,
    cacheInvalidatePattern: fakeCacheInvalidate,
    CACHE_KEYS: fakeCACHE_KEYS,
    getPropertyInvalidationPatterns: fakeGetPatterns,
    defaultCurrency: 'USD',
  })

  // Assertions
  expect(res && res.ok).toBe(true)
  expect(upsertCalled).toBe(true)
  expect(upsertArgs.id).toBe(property.id)
  expect(upsertArgs.doc).toBeDefined()
  expect(cacheDelCalled).toBe(true)
  expect(cacheInvalidateCalled.length).toBeGreaterThanOrEqual(1)
})
