import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { StandardLayout } from '../components';
import { FilterOptions } from '../components/MapFilters';
import standardStyles from '../styles/StandardComponents.module.css';

export default function HmrTest() {
  const [count, setCount] = useState(0);
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
      title="HMR Test Page"
      subtitle="Development testing page for Hot Module Replacement"
      showMapFilters={true}
      onFilterChange={handleFilterChange}
      onSearchLocationChange={handleSearchLocationChange}
      searchLocation=""
      initialFilters={{}}
    >
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '600', 
            marginBottom: '16px',
            color: '#2d3748'
          }}>
            HMR Test Page
          </h1>
          <p style={{ 
            color: '#718096',
            marginBottom: '32px'
          }}>
            This is a development page for testing Hot Module Replacement (HMR).
          </p>
          <p 
            data-testid="hmr-text" 
            style={{ 
              fontSize: '18px',
              marginBottom: '24px',
              color: '#2d3748'
            }}
          >
            Edit this text to trigger HMR. Count: {count}
          </p>
          <button 
            className={standardStyles.primaryButton}
            onClick={() => setCount((c) => c + 1)}
          >
            Increment ({count})
          </button>
          <div style={{ marginTop: '24px' }}>
            <button
              className={standardStyles.secondaryButton}
              onClick={() => router.push('/')}
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
}
