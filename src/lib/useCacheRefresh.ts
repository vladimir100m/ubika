import { useCallback } from 'react';

/**
 * Hook to manually trigger cache refresh on the server
 * Useful after property create/update/delete operations
 */
export function useCacheRefresh() {
  const refreshCache = useCallback(
    async (options?: { scope?: 'user' | 'all'; propertyId?: string }) => {
      try {
        const response = await fetch('/api/cache/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options || { scope: 'all' }),
        });

        if (!response.ok) {
          console.warn('Cache refresh failed:', response.status);
          return false;
        }

        const data = await response.json();
        console.log('Cache refreshed:', data);
        return data.success;
      } catch (error) {
        console.error('Error refreshing cache:', error);
        return false;
      }
    },
    []
  );

  return { refreshCache };
}

export default useCacheRefresh;
