import React from 'react';
import { useRouter } from 'next/router';
import { StandardLayout } from '../components';
import { FilterOptions } from '../components/MapFilters';
import standardStyles from '../styles/StandardComponents.module.css';

function Custom404() {
  const router = useRouter();

  // Filter handlers - redirect to map page with filters
  const handleFilterChange = (filters: FilterOptions) => {
    const query: any = {};
    if (filters.operation) query.operation = filters.operation;
    if (filters.priceMin) query.minPrice = filters.priceMin;
    if (filters.priceMax) query.maxPrice = filters.priceMax;
    if (filters.beds) query.beds = filters.beds;
    if (filters.baths) query.baths = filters.baths;
    if (filters.homeType) query.homeType = filters.homeType;
    router.push({ pathname: '/map', query });
  };

  const handleSearchLocationChange = (location: string) => {
    router.push({ pathname: '/map', query: { address: location } });
  };

  return (
    <StandardLayout 
      title="Page Not Found" 
      subtitle="The page you are looking for does not exist"
      showMapFilters={true}
      onFilterChange={handleFilterChange}
      onSearchLocationChange={handleSearchLocationChange}
      searchLocation=""
      initialFilters={{}}
    >
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ 
          fontSize: '72px', 
          fontWeight: 'bold', 
          color: '#e53e3e',
          marginBottom: '24px'
        }}>
          404
        </div>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#2d3748'
        }}>
          Page Not Found
        </h1>
        <p style={{ 
          fontSize: '16px',
          color: '#718096',
          marginBottom: '32px',
          maxWidth: '400px',
          margin: '0 auto 32px'
        }}>
          The page you are looking for might have been moved, deleted, or you entered the wrong URL.
        </p>
        <button
          className={standardStyles.primaryButton}
          onClick={() => router.push('/')}
          style={{ marginRight: '16px' }}
        >
          Go to Home
        </button>
        <button
          className={standardStyles.secondaryButton}
          onClick={() => router.push('/map')}
        >
          Browse Properties
        </button>
      </div>
    </StandardLayout>
  );
}

export default Custom404;
