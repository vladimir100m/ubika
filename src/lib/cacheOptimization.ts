import { createHash } from 'crypto';
import { CACHE_KEYS } from './cacheKeyBuilder';

export interface NormalizedFilters {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  operation?: string;
  zone?: string;
  minArea?: number;
  maxArea?: number;
}

export const normalizeFilters = (filters: any): NormalizedFilters => {
  const normalized: NormalizedFilters = {};
  if (!filters) return normalized;

  if (filters?.minPrice) normalized.minPrice = parseInt(String(filters.minPrice), 10);
  if (filters?.maxPrice) normalized.maxPrice = parseInt(String(filters.maxPrice), 10);
  if (filters?.bedrooms) normalized.bedrooms = parseInt(String(filters.bedrooms), 10);
  if (filters?.bathrooms) normalized.bathrooms = parseInt(String(filters.bathrooms), 10);
  if (filters?.propertyType) normalized.propertyType = String(filters.propertyType).toLowerCase().trim();
  if (filters?.operation) normalized.operation = String(filters.operation).toLowerCase().trim();
  if (filters?.zone) normalized.zone = String(filters.zone).toLowerCase().trim();
  if (filters?.minArea) normalized.minArea = parseInt(String(filters.minArea), 10);
  if (filters?.maxArea) normalized.maxArea = parseInt(String(filters.maxArea), 10);

  return normalized;
};

export const buildSemanticCacheKey = (sellerId?: string, filters?: NormalizedFilters): string => {
  const parts: string[] = [];
  if (sellerId) parts.push(`seller:${sellerId}`);
  else parts.push('v1:properties');
  parts.push('list');

  if (!filters || Object.keys(filters).length === 0) return parts.join(':');

  const entries = Object.entries(filters)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) return parts.join(':');

  // Build a short readable filter prefix so pattern invalidation can match
  const readableParts: string[] = [];
  const readableMap: Record<string, string> = Object.fromEntries(entries.map(([k, v]) => [k, String(v)]));
  if (readableMap.zone) readableParts.push(`zone=${readableMap.zone}`);
  if (readableMap.operation) readableParts.push(`op=${readableMap.operation}`);
  if (readableMap.bedrooms) readableParts.push(`beds=${readableMap.bedrooms}`);
  if (readableMap.minPrice) readableParts.push(`pmin=${readableMap.minPrice}`);
  if (readableMap.maxPrice) readableParts.push(`pmax=${readableMap.maxPrice}`);

  if (readableParts.length > 0) {
    parts.push(readableParts.join(':'));
  }

  const filterString = entries.map(([k, v]) => `${k}=${v}`).join('|');
  const filterHash = createHash('md5').update(filterString).digest('hex').slice(0, 8);
  parts.push(filterHash);
  return parts.join(':');
};

export const getAffectedCachePatterns = (property: any): string[] => {
  const patterns = new Set<string>();
  patterns.add('properties:list:*');

  if (property?.city) {
    const city = String(property.city).toLowerCase().trim();
    patterns.add(`properties:list:*zone=${city}*`);
    patterns.add(`seller:*:list:*zone=${city}*`);
  }

  if (property?.operation_status_id === 1) {
    patterns.add('properties:list:*operation=sale*');
    patterns.add('seller:*:list:*operation=sale*');
  } else if (property?.operation_status_id === 2) {
    patterns.add('properties:list:*operation=rent*');
    patterns.add('seller:*:list:*operation=rent*');
  }

  if (property?.price) patterns.add('properties:list:*price*');
  if (property?.rooms) patterns.add('properties:list:*bedrooms*');

  return Array.from(patterns);
};

export default {
  normalizeFilters,
  buildSemanticCacheKey,
  getAffectedCachePatterns,
};
