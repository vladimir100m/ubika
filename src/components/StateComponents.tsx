import React from 'react';
import styles from '../styles/Home.module.css';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading properties...' 
}) => (
  <div className={styles.loadingContainer}>
    <div className={styles.loadingSpinner}></div>
    <p>{message}</p>
  </div>
);

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  message = 'Unable to load properties. Please try again later.',
  onRetry,
  retryText = 'Try Again'
}) => (
  <div className={styles.errorContainer}>
    <p className={styles.errorMessage}>{message}</p>
    {onRetry && (
      <button 
        className={styles.retryButton}
        onClick={onRetry}
      >
        {retryText}
      </button>
    )}
  </div>
);

interface EmptyStateProps {
  message?: string;
  showClearFilters?: boolean;
  onClearFilters?: () => void;
  clearFiltersText?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = 'No properties found matching your criteria.',
  showClearFilters = false,
  onClearFilters,
  clearFiltersText = 'Clear Filters'
}) => (
  <div className={styles.emptyState}>
    <p>{message}</p>
    {showClearFilters && onClearFilters && (
      <button 
        className={styles.clearFiltersButton}
        onClick={onClearFilters}
      >
        {clearFiltersText}
      </button>
    )}
  </div>
);

interface ResultsInfoProps {
  count: number;
  loading: boolean;
  sortOptions?: Array<{ value: string; label: string }>;
  currentSort?: string;
  onSortChange?: (value: string) => void;
}

export const ResultsInfo: React.FC<ResultsInfoProps> = ({
  count,
  loading,
  sortOptions = [
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'bedrooms', label: 'Bedrooms' }
  ],
  currentSort = 'price-asc',
  onSortChange
}) => (
  <div className={styles.resultsInfo}>
    <span className={styles.resultsCount}>
      {loading ? 'Loading...' : `${count} properties found`}
    </span>
    {onSortChange && (
      <div className={styles.sortControls}>
        <select 
          className={styles.sortSelect}
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )}
  </div>
);

interface PropertySectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const PropertySection: React.FC<PropertySectionProps> = ({
  title,
  subtitle,
  children,
  className = ''
}) => (
  <section className={`${styles.propertySection} ${className}`}>
    {children}
  </section>
);
