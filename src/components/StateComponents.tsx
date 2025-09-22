import React from 'react';
import standardStyles from '../styles/StandardComponents.module.css';

// Spinner keyframes are centralized in global CSS; no injection needed.

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading properties...' 
}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    color: '#666'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #0070f3',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '16px'
    }}></div>
    <p style={{ margin: 0, fontSize: '14px' }}>{message}</p>
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
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center'
  }}>
    <p style={{
      color: '#e53e3e',
      fontSize: '16px',
      marginBottom: '16px'
    }}>{message}</p>
    {onRetry && (
      <button 
        className={standardStyles.buttonSecondary}
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
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center'
  }}>
    <p style={{
      color: '#666',
      fontSize: '16px',
      marginBottom: '20px'
    }}>{message}</p>
    {showClearFilters && onClearFilters && (
      <button 
        className={standardStyles.buttonPrimary}
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
  onSortChange ? (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      padding: '16px 0',
      borderBottom: '1px solid #e5e5e5'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <select 
          className={standardStyles.select}
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
    </div>
  ) : null
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
  <section style={{
    padding: '20px 0'
  }} className={className}>
    {children}
  </section>
);
