export interface Neighborhood {
  id?: string
  name?: string
  city?: string
}

export interface PropertyDocData {
  id?: string
  title?: string
  description?: string
  summary?: string
  features?: string[]
  images?: string[]
  neighborhood?: Neighborhood
  price?: number
  currency?: string
  price_per_m2?: number
  [key: string]: any
}

export interface PropertyDocument {
  _id?: any
  property_id: string
  doc: PropertyDocData
  updated_at?: Date
}

export interface SearchFilters {
  q?: string
  city?: string
  priceMin?: number
  priceMax?: number
}

export interface SearchResult {
  results: PropertyDocument[]
  page: number
  pageSize: number
  total: number
}

export default PropertyDocument
