// Helper used by the sync endpoint. Implemented in plain JS so tests can
// require and run without TypeScript toolchain.

function buildDoc({ property, images = [], features = [], defaultCurrency = 'USD' }) {
  return {
    id: property.id,
    title: property.title,
    description: property.description,
    summary: property.description ? property.description.slice(0, 240) : undefined,
    features: (features || []).map((f) => f.name),
    images: (images || []).map((i) => i.image_url),
    neighborhood: { name: property.city, city: property.city },
    price: property.price,
    price_per_m2:
      property.price && property.squareMeters ? Math.round(property.price / property.squareMeters) : undefined,
    currency: defaultCurrency,
    _raw: { property, images, features },
  }
}

async function buildAndUpsert({
  property,
  images = [],
  features = [],
  resolveImageUrl = async (u) => u,
  upsertPropertyDocument = async (id, doc) => null,
  cacheDel = async () => null,
  cacheInvalidatePattern = async () => null,
  CACHE_KEYS = { property: (id) => `property:${id}` },
  getPropertyInvalidationPatterns = () => [],
  defaultCurrency = 'USD',
} = {}) {
  // resolve image URLs
  const resolvedImages = []
  for (const img of images || []) {
    try {
      const resolved = await resolveImageUrl(img.image_url)
      resolvedImages.push({ ...img, image_url: resolved })
    } catch (e) {
      resolvedImages.push(img)
    }
  }

  const doc = buildDoc({ property, images: resolvedImages, features, defaultCurrency })

  // perform upsert
  await upsertPropertyDocument(property.id, doc)

  // cache invalidation
  const cacheKey = CACHE_KEYS.property(property.id)
  await cacheDel(cacheKey)
  const patterns = getPropertyInvalidationPatterns(property)
  for (const p of patterns) await cacheInvalidatePattern(p)

  return { ok: true, doc }
}

module.exports = { buildDoc, buildAndUpsert }
