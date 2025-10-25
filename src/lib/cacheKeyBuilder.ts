/**
 * Centralized cache key builder
 * Single source of truth for all cache key patterns
 * Prevents inconsistencies and makes keys easy to refactor
 */

const CACHE_VERSION = '1';

/**
 * Build all cache keys using consistent patterns
 * Format: v{version}:cache-type:identifiers:filters
 */
export const CACHE_KEYS = {
  /**
   * Individual property detail cache
   * Key: v1:property:123
   */
  property: (id: string) => `v${CACHE_VERSION}:property:${id}`,

  /**
   * All properties listing cache
   * Base key: v1:properties:list
   * Pattern: v1:properties:list:*
   */
  properties: {
    list: () => `v${CACHE_VERSION}:properties:list`,
    listPattern: () => `v${CACHE_VERSION}:properties:list:*`,
    // Specific patterns for targeted invalidation
    listByZone: (zone: string) => `v${CACHE_VERSION}:properties:list:*zone=${zone.toLowerCase()}*`,
    listByOperation: (op: string) => `v${CACHE_VERSION}:properties:list:*op=${op.toLowerCase()}*`,
  },

  /**
   * Seller's properties listing cache
   * Base key: v1:seller:123:list
   * Pattern: v1:seller:123:list:*
   */
  seller: (sellerId: string) => ({
    list: () => `v${CACHE_VERSION}:seller:${sellerId}:list`,
    listPattern: () => `v${CACHE_VERSION}:seller:${sellerId}:list:*`,
    listByZone: (zone: string) => `v${CACHE_VERSION}:seller:${sellerId}:list:*zone=${zone.toLowerCase()}*`,
    listByOperation: (op: string) => `v${CACHE_VERSION}:seller:${sellerId}:list:*op=${op.toLowerCase()}*`,
  }),

  /**
   * Session cache
   * Key: v1:session:user-id
   */
  session: (userId: string) => `v${CACHE_VERSION}:session:${userId}`,

  /**
   * Static reference data (rarely changes)
   * Keys: v1:property-types:list, v1:property-statuses:list, etc.
   */
  references: {
    propertyTypes: () => `v${CACHE_VERSION}:property-types:list`,
    propertyStatuses: () => `v${CACHE_VERSION}:property-statuses:list`,
    propertyOperationStatuses: () => `v${CACHE_VERSION}:property-operation-statuses:list`,
    propertyFeatures: () => `v${CACHE_VERSION}:property-features:list`,
    neighborhoods: (hash: string) => `v${CACHE_VERSION}:neighborhoods:${hash}`,
  },
};

/**
 * Get all cache patterns that should be invalidated for a given property
 * Used when property is created/updated/deleted
 */
export const getPropertyInvalidationPatterns = (
  property: any,
  options?: { includeGlobal?: boolean; includeSeller?: boolean }
) => {
  const { includeGlobal = true, includeSeller = true } = options || {};
  const patterns = new Set<string>();

  if (includeGlobal) {
    patterns.add(CACHE_KEYS.properties.listPattern());
  }

  if (includeSeller && property?.seller_id) {
    patterns.add(CACHE_KEYS.seller(property.seller_id).listPattern());
  }

  // Targeted invalidations based on property attributes
  if (property?.city && includeGlobal) {
    patterns.add(CACHE_KEYS.properties.listByZone(property.city));
  }

  if (property?.city && includeSeller && property?.seller_id) {
    patterns.add(CACHE_KEYS.seller(property.seller_id).listByZone(property.city));
  }

  if (property?.operation_status_id && includeGlobal) {
    const opStr = property.operation_status_id === 1 ? 'sale' : property.operation_status_id === 2 ? 'rent' : '';
    if (opStr) patterns.add(CACHE_KEYS.properties.listByOperation(opStr));
  }

  if (property?.operation_status_id && includeSeller && property?.seller_id) {
    const opStr = property.operation_status_id === 1 ? 'sale' : property.operation_status_id === 2 ? 'rent' : '';
    if (opStr) patterns.add(CACHE_KEYS.seller(property.seller_id).listByOperation(opStr));
  }

  return Array.from(patterns);
};

/**
 * Version check - call this on app startup
 * If cache version changes, all old keys are ignored (safe deployments)
 */
export const getCacheVersion = () => CACHE_VERSION;

export default CACHE_KEYS;
