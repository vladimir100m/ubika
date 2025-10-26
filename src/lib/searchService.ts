import { searchPropertyDocuments } from './readModel'
import { cacheGet, cacheSet } from './cache'
import { CACHE_KEYS } from './cacheKeyBuilder'

export type SearchFilters = {
  q?: string
  city?: string
  priceMin?: number
  priceMax?: number
}

export async function searchCached(filters: SearchFilters, page = 1, pageSize = 20) {
  // Build a stable cache key based on filters + pagination
  const keyParts = [
    CACHE_KEYS.properties.list(),
    `q=${filters.q || ''}`,
    `city=${(filters.city || '').toLowerCase()}`,
    `pmin=${filters.priceMin ?? ''}`,
    `pmax=${filters.priceMax ?? ''}`,
    `page=${page}`,
    `ps=${pageSize}`,
  ]
  const key = keyParts.join(':')

  // Try cache
  try {
    const cached = await cacheGet<any>(key)
    if (cached) return cached
  } catch (e) {
    // ignore cache errors
    // eslint-disable-next-line no-console
    console.warn('[searchCached] cacheGet error', e && e.message)
  }

  // Query read-model
  const res = await searchPropertyDocuments(filters as any, page, pageSize)

  // Store in cache for short TTL
  try {
    await cacheSet(key, res, 30) // 30s
  } catch (e) {
    // noop
    // eslint-disable-next-line no-console
    console.warn('[searchCached] cacheSet error', e && e.message)
  }

  return res
}

export default { searchCached }
