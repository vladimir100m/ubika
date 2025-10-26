/**
 * Frontend cache utilities for ensuring fresh data after mutations
 */

interface CacheBustOptions {
  /** Property ID that was updated */
  propertyId?: string | number;
  /** Force refetch all properties lists */
  forceListRefresh?: boolean;
  /** Additional timestamp for cache busting */
  timestamp?: number;
}

/**
 * Generate cache-busting query parameters for API requests
 * Use this after property/image mutations to ensure fresh data
 */
export function getCacheBustParams(options: CacheBustOptions = {}): string {
  const params = new URLSearchParams();
  
  // Always add a timestamp to bust browser/proxy caches
  params.set('_t', (options.timestamp || Date.now()).toString());
  
  // Add property-specific bust parameter
  if (options.propertyId) {
    params.set('_pid', options.propertyId.toString());
  }
  
  // Add list refresh indicator
  if (options.forceListRefresh) {
    params.set('_refresh', '1');
  }
  
  return params.toString();
}

/**
 * Build a fresh API URL with cache-busting parameters
 */
export function buildFreshApiUrl(baseUrl: string, options: CacheBustOptions = {}): string {
  const separator = baseUrl.includes('?') ? '&' : '?';
  const cacheBustParams = getCacheBustParams(options);
  return `${baseUrl}${separator}${cacheBustParams}`;
}

/**
 * Fetch property data with cache busting
 * Use this after image uploads or property updates
 */
export async function fetchFreshProperty(propertyId: string | number): Promise<any> {
  const url = buildFreshApiUrl(`/api/properties/${propertyId}`, { 
    propertyId,
    timestamp: Date.now()
  });
  
  const response = await fetch(url, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch property: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch properties list with cache busting
 * Use this after property mutations that affect listings
 */
export async function fetchFreshProperties(searchParams?: URLSearchParams): Promise<any[]> {
  const baseUrl = '/api/properties';
  const existingParams = searchParams?.toString() || '';
  const url = existingParams 
    ? buildFreshApiUrl(`${baseUrl}?${existingParams}`, { forceListRefresh: true })
    : buildFreshApiUrl(baseUrl, { forceListRefresh: true });
  
  const response = await fetch(url, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch properties: ${response.statusText}`);
  }
  
  return response.json();
}

export default {
  getCacheBustParams,
  buildFreshApiUrl,
  fetchFreshProperty,
  fetchFreshProperties
};