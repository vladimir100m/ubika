import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';
import mobileStyles from '../styles/Mobile.module.css';
import useMediaQuery from '../lib/useMediaQuery';
import { SearchFilters } from '../ui/SearchBar';
import { StandardLayout } from '../ui';
import { FilterOptions } from '../ui/MapFilters';

interface SearchHistoryItem {
  id: number;
  address: string;
  filters?: SearchFilters;
  timestamp: string;
}

const RecentSearches: React.FC = () => {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter handlers - redirect to map page with filters
  const handleFilterChange = (filters: FilterOptions) => {
    const query: any = {};
    if (filters.operation) query.operation = filters.operation;
    if (filters.priceMin) query.minPrice = filters.priceMin;
    if (filters.priceMax) query.maxPrice = filters.priceMax;
    if (filters.beds) query.bedrooms = filters.beds;
    if (filters.baths) query.bathrooms = filters.baths;
    if (filters.homeType) query.propertyType = filters.homeType;
    if (filters.moreFilters.minArea) query.minArea = filters.moreFilters.minArea;
    if (filters.moreFilters.maxArea) query.maxArea = filters.moreFilters.maxArea;
    
    router.push({
      pathname: '/map',
      query
    });
  };

  const handleSearchLocationChange = (location: string) => {
    const query: any = {};
    if (location && location.trim() !== '') {
      query.zone = location;
    }
    router.push({
      pathname: '/map',
      query
    });
  };

  // Get operation from query parameters, default to 'buy'
  const operation = router.query.operation
    ? router.query.operation as 'buy' | 'rent'
    : 'buy';

  const handleOperationChange = (operation: 'buy' | 'rent') => {
    // Navigate to map page with operation filter
    router.push({
      pathname: '/map',
      query: { operation }
    });
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Load search history from localStorage
    try {
      const savedHistory = localStorage.getItem('searchHistory');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading search history:', error);
      setError('Failed to load your search history');
      setLoading(false);
    }
  }, []);

  const handleSearchClick = (search: SearchHistoryItem) => {
    const query: any = { address: search.address };
    
    if (search.filters) {
      if (search.filters.minPrice) query.minPrice = search.filters.minPrice;
      if (search.filters.maxPrice) query.maxPrice = search.filters.maxPrice;
      if (search.filters.bedrooms) query.bedrooms = search.filters.bedrooms;
      if (search.filters.bathrooms) query.bathrooms = search.filters.bathrooms;
      if (search.filters.propertyType) query.propertyType = search.filters.propertyType;
      if (search.filters.operation) query.operation = search.filters.operation;
      if (search.filters.zone) query.zone = search.filters.zone;
      if (search.filters.minArea) query.minArea = search.filters.minArea;
      if (search.filters.maxArea) query.maxArea = search.filters.maxArea;
    }
    
    router.push({
      pathname: '/map',
      query
    });
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('searchHistory');
    setSearchHistory([]);
  };

  const deleteSearchItem = (id: number) => {
    const newHistory = searchHistory.filter(item => item.id !== id);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <StandardLayout 
      title="Recent Searches" 
      subtitle="Your search history"
      showMapFilters={true}
      onFilterChange={handleFilterChange}
      onSearchLocationChange={handleSearchLocationChange}
      searchLocation=""
      initialFilters={{}}
    >
      <section className={styles.featuredProperties}>
        <div className={styles.searchHistoryHeader}>
          <h2>Your Recent Searches</h2>
          {searchHistory.length > 0 && (
            <button 
              className={styles.clearHistoryButton}
              onClick={clearSearchHistory}
            >
              Clear History
            </button>
          )}
        </div>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading your search history...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={() => router.reload()}
            >
              Try Again
            </button>
          </div>
        ) : searchHistory.length > 0 ? (
          <div className={styles.searchHistoryList}>
            {searchHistory.map((search) => (
              <div 
                key={search.id} 
                className={styles.searchHistoryItem}
              >
                <div 
                  className={styles.searchDetails}
                  onClick={() => handleSearchClick(search)}
                >
                  <div className={styles.searchAddress}>
                    <span className={styles.searchIcon}>🔍</span>
                    {search.address}
                  </div>
                  {search.filters && Object.values(search.filters).some(val => val) && (
                    <div className={styles.searchFilters}>
                      {search.filters.operation && (
                        <span className={styles.filterTag}>
                          {search.filters.operation === 'sale' ? 'Venta' : 'Alquiler'}
                        </span>
                      )}
                      {search.filters.propertyType && (
                        <span className={styles.filterTag}>{search.filters.propertyType}</span>
                      )}
                      {search.filters.zone && (
                        <span className={styles.filterTag}>{search.filters.zone}</span>
                      )}
                      {search.filters.minPrice && (
                        <span className={styles.filterTag}>Min: ${search.filters.minPrice}</span>
                      )}
                      {search.filters.maxPrice && (
                        <span className={styles.filterTag}>Max: ${search.filters.maxPrice}</span>
                      )}
                      {search.filters.bedrooms && (
                        <span className={styles.filterTag}>{search.filters.bedrooms}+ hab</span>
                      )}
                      {search.filters.bathrooms && (
                        <span className={styles.filterTag}>{search.filters.bathrooms}+ baños</span>
                      )}
                      {search.filters.minArea && (
                        <span className={styles.filterTag}>Min: {search.filters.minArea}m²</span>
                      )}
                      {search.filters.maxArea && (
                        <span className={styles.filterTag}>Max: {search.filters.maxArea}m²</span>
                      )}
                    </div>
                  )}
                </div>
                <div className={styles.searchTimestamp}>
                  {formatDate(search.timestamp)}
                </div>
                <button 
                  className={styles.deleteSearchButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSearchItem(search.id);
                  }}
                  aria-label="Delete search"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyStateContainer}>
            <div className={styles.emptyStateIcon}>🔍</div>
            <h2 className={styles.emptyStateTitle}>No recent searches</h2>
            <p className={styles.emptyStateMessage}>
              Your search history will appear here once you start searching for properties.
            </p>
            <button 
              className={styles.browseButton}
              onClick={() => router.push('/map')}
            >
              Start Searching
            </button>
          </div>
        )}
      </section>
      
    </StandardLayout>
  );
};

export default RecentSearches;
