import type { PropertyDocument } from './types'

// Import the JS helper so tests can continue to use the JS entrypoint.
const syncJs = require('./syncProperty')

export interface BuildAndUpsertParams {
  property: any
  images?: any[]
  features?: any[]
  resolveImageUrl?: (url: string) => Promise<string | null>
  upsertPropertyDocument: (id: string, doc: PropertyDocument) => Promise<void>
  cacheDel: (key: string) => Promise<void>
  cacheInvalidatePattern: (pattern: string) => Promise<void>
  CACHE_KEYS: { property: (id: string) => string }
  getPropertyInvalidationPatterns: (property: any, options?: any) => string[]
  defaultCurrency?: string
}

export async function buildAndUpsertTyped(params: BuildAndUpsertParams): Promise<{ ok: true; doc: any }> {
  // Delegate to the JS implementation which is easier to test in Node.
  const res = await syncJs.buildAndUpsert(params)
  return res
}

export default { buildAndUpsertTyped }
