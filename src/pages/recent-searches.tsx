import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';
import mobileStyles from '../styles/Mobile.module.css';
import MobileNavigation from '../components/MobileNavigation';
import useMediaQuery from '../utils/useMediaQuery';
import { SearchFilters } from '../components/SearchBar';
import { useAuth } from '../context/AuthContext';

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
  const { user, loading: authLoading } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/recent-searches');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Only load search history if user is logged in
    if (!user) return;

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
  }, [user]);

  const handleSearchClick = (search: SearchHistoryItem) => {
    const query: any = { address: search.address };
    
    if (search.filters) {
      if (search.filters.minPrice) query.minPrice = search.filters.minPrice;
      if (search.filters.maxPrice) query.maxPrice = search.filters.maxPrice;
      if (search.filters.bedrooms) query.bedrooms = search.filters.bedrooms;
      if (search.filters.propertyType) query.propertyType = search.filters.propertyType;
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

  // If authentication is loading, show a loading state
  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your account...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not loading, the useEffect will handle redirect
  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <header className={`${styles.navbar} ${isMobile ? mobileStyles.onlyMobile : ''}`}>
        <div className={styles.logo} onClick={() => router.push('/')}>Ubika</div>
        <div className={mobileStyles.onlyDesktop}>
          <nav>
            <a href="#">Buy</a>
            <a href="#">Rent</a>
            <a href="/seller">Sell</a>
            <a href="#">Mortgage</a>
            <a href="/saved-properties">Saved Homes</a>
            <a href="/user/profile">My Account</a>
          </nav>
        </div>
      </header>

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
                      {search.filters.minPrice && (
                        <span className={styles.filterTag}>Min: ${search.filters.minPrice}</span>
                      )}
                      {search.filters.maxPrice && (
                        <span className={styles.filterTag}>Max: ${search.filters.maxPrice}</span>
                      )}
                      {search.filters.bedrooms && (
                        <span className={styles.filterTag}>{search.filters.bedrooms}+ bed</span>
                      )}
                      {search.filters.propertyType && (
                        <span className={styles.filterTag}>{search.filters.propertyType}</span>
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
      
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default RecentSearches;
