import { getDb } from './mongo'
import type { PropertyDocument, SearchFilters, SearchResult } from './types'

const COLLECTION = 'property_documents'

export async function upsertPropertyDocument(propertyId: string, doc: PropertyDocument): Promise<void> {
  const db = await getDb()
  const col = db.collection(COLLECTION)
  await col.updateOne(
    { property_id: propertyId },
    { $set: { property_id: propertyId, doc, updated_at: new Date() } },
    { upsert: true }
  )
}

export async function getPropertyDocument(propertyId: string): Promise<PropertyDocument | null> {
  const db = await getDb()
  const col = db.collection(COLLECTION)
  const found = await col.findOne({ property_id: propertyId })
  return found as PropertyDocument | null
}

export async function searchPropertyDocuments(filters: SearchFilters, page = 1, pageSize = 20): Promise<SearchResult> {
  const db = await getDb()
  const col = db.collection(COLLECTION)

  const query: any = {}
  if (filters.city) query['doc.neighborhood.city'] = filters.city
  if (typeof filters.priceMin === 'number') query['doc.price'] = { ...(query['doc.price'] || {}), $gte: filters.priceMin }
  if (typeof filters.priceMax === 'number') query['doc.price'] = { ...(query['doc.price'] || {}), $lte: filters.priceMax }

  if (filters.q) {
    // attempt text search if index exists, otherwise fallback to regex on title/description
    query.$or = [
      { 'doc.title': { $regex: filters.q, $options: 'i' } },
      { 'doc.description': { $regex: filters.q, $options: 'i' } }
    ]
  }

  const skip = (page - 1) * pageSize
  const cursor = col.find(query).sort({ updated_at: -1 }).skip(skip).limit(pageSize)
  const results = await cursor.toArray()
  const total = await col.countDocuments(query)

  return {
    results: results as PropertyDocument[],
    page,
    pageSize,
    total
  }
}

export default { upsertPropertyDocument, getPropertyDocument, searchPropertyDocuments }
