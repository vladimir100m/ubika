import React from 'react';
import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { StandardLayout } from '../components';
import { FilterOptions } from '../components/MapFilters';
import standardStyles from '../styles/StandardComponents.module.css';

function Error({ statusCode }: { statusCode: number }) {
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

  const errorMessage = statusCode
    ? `An error ${statusCode} occurred on server`
    : 'An error occurred on client';

  const getErrorDetails = (statusCode: number) => {
    switch (statusCode) {
      case 404:
        return {
          title: 'Page Not Found',
          description: 'The page you are looking for does not exist.'
        };
      case 500:
        return {
          title: 'Internal Server Error',
          description: 'Something went wrong on our end. Please try again later.'
        };
      case 403:
        return {
          title: 'Access Denied',
          description: 'You do not have permission to access this resource.'
        };
      default:
        return {
          title: 'Unexpected Error',
          description: 'An unexpected error occurred. Please try again.'
        };
    }
  };

  const { title, description } = getErrorDetails(statusCode);

  return (
    <StandardLayout 
      title={title}
      subtitle={description}
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
          {statusCode || 'Error'}
        </div>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#2d3748'
        }}>
          {title}
        </h1>
        <p style={{ 
          fontSize: '16px',
          color: '#718096',
          marginBottom: '16px'
        }}>
          {description}
        </p>
        <p style={{ 
          fontSize: '14px',
          color: '#a0aec0',
          marginBottom: '32px',
          fontFamily: 'monospace'
        }}>
          {errorMessage}
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
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    </StandardLayout>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
