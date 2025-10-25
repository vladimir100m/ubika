import { useEffect } from 'react';

/**
 * Hook to refresh data when the window regains focus
 * Useful for updating stale data when user switches tabs/windows
 * 
 * @param callback - Function to call when window regains focus
 * @param enabled - Whether to enable this hook (default: true)
 */
export function useWindowFocus(callback: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleFocus = () => {
      console.log('Window focused - refreshing data');
      callback();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [callback, enabled]);
}

export default useWindowFocus;
