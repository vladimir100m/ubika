'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Banner from '../ui/Banner';
import PropertyCardGrid from '../ui/PropertyCardGrid';
import PropertyPopup from '../ui/PropertyPopup';
import StandardLayout from '../ui/StandardLayout';
import { LoadingState, ErrorState, EmptyState, ResultsInfo, PropertySection } from '../ui/StateComponents';
import standardStyles from '../styles/StandardComponents.module.css';
import styles from '../styles/Home.module.css';
import { Property } from '../types'; // Import Property type
import { FilterOptions } from '../ui/MapFilters';
import { buildFreshApiUrl } from '../lib/frontendCacheUtils';
import { usePropertyUpdateListener, PropertyUpdateEvent } from '../lib/propertyUpdateEvents';
const Home: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const [properties, setProperties] = useState<Property[]>([]); // Typed state
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const popupMapRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams(searchParams?.toString() ?? '');
        // Use cache-busting URL to ensure fresh data
        const apiUrl = buildFreshApiUrl('/api/properties', { forceListRefresh: true });
        const fullUrl = queryParams.toString() 
          ? `${apiUrl}&${queryParams.toString()}`
          : apiUrl;
          
        const response = await fetch(fullUrl, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (!response.ok) {
          throw new Error(`Error fetching properties: ${response.statusText}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setProperties(data);
        } else {
          console.error('Error fetching properties: Data is not an array', data);
          setError('Unable to load properties. Please try again later.');
          setProperties([]); // Set to empty array on error or unexpected format
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('Unable to load properties. Please try again later.');
        setProperties([]); // Set to empty array on catch
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [searchParams, user, isLoading]);

  // Listen for property update events and refresh data when images are updated
  useEffect(() => {
    const cleanup = usePropertyUpdateListener((event: PropertyUpdateEvent) => {
      if (event.type === 'PROPERTY_IMAGES_UPDATED') {
        console.log('🏠 Home page received image update event, refreshing properties...');
        // Refresh the properties list to show updated image counts
        setLoading(true);
        const queryParams = new URLSearchParams(searchParams?.toString() ?? '');
        const apiUrl = buildFreshApiUrl('/api/properties', { 
          forceListRefresh: true,
          timestamp: Date.now() // Force fresh data
        });
        const fullUrl = queryParams.toString() 
          ? `${apiUrl}&${queryParams.toString()}`
          : apiUrl;
          
        fetch(fullUrl, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            setProperties(data);
            console.log('✅ Home page properties refreshed after image update');
          }
        })
        .catch(error => {
          console.error('❌ Failed to refresh properties after image update:', error);
        })
        .finally(() => {
          setLoading(false);
        });
      }
    });

    return cleanup;
  }, [searchParams]);

  // Function to handle property card click
  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
  };

  const handleClosePropertyDetail = () => {
    setSelectedProperty(null);
  };

  // Function to handle filter changes
  const handleFilterChange = (filters: FilterOptions) => {
    // Build query object from filters
    const query: any = {};
    
    if (filters.operation) query.operation = filters.operation;
    if (filters.priceMin) query.minPrice = filters.priceMin;
    if (filters.priceMax) query.maxPrice = filters.priceMax;
    if (filters.beds) query.bedrooms = filters.beds;
    if (filters.baths) query.bathrooms = filters.baths;
    if (filters.homeType) query.propertyType = filters.homeType;
    if (filters.moreFilters.minArea) query.minArea = filters.moreFilters.minArea;
    if (filters.moreFilters.maxArea) query.maxArea = filters.moreFilters.maxArea;
    
    const newParams = new URLSearchParams(query).toString();
    router.push(`/?${newParams}`);
  };

  const handleSearchLocationChange = (location: string) => {
    const currentParams = new URLSearchParams(searchParams?.toString() ?? '');
    if (location && location.trim() !== '') {
      currentParams.set('zone', location);
    } else {
      currentParams.delete('zone');
    }
    router.push(`/?${currentParams.toString()}`);
  };

  const getInitialFilters = (): Partial<FilterOptions> => {
    return {
      operation: searchParams?.get('operation') || '',
      priceMin: searchParams?.get('minPrice') || '',
      priceMax: searchParams?.get('maxPrice') || '',
      beds: searchParams?.get('bedrooms') || '',
      baths: searchParams?.get('bathrooms') || '',
      homeType: searchParams?.get('propertyType') || '',
      moreFilters: {
        minArea: searchParams?.get('minArea') || '',
        maxArea: searchParams?.get('maxArea') || '',
        yearBuiltMin: '',
        yearBuiltMax: '',
        keywords: []
      }
    };
  };

  return (
    <StandardLayout
      showMapFilters={true}
      onFilterChange={handleFilterChange}
      onSearchLocationChange={handleSearchLocationChange}
      searchLocation={searchParams?.get('zone') || ''}
      initialFilters={getInitialFilters()}
    >
      <Banner onFilterChange={handleFilterChange} />
      <main className={standardStyles.main}>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <>
            <ResultsInfo propertyCount={properties.length} />
            {properties.length > 0 ? (
              <PropertyCardGrid
                properties={properties}
                onPropertyClick={handlePropertyClick}
              />
            ) : (
              <EmptyState message="No properties match the current filters. Try adjusting your search." />
            )}
          </>
        )}
      </main>
      {selectedProperty && (
        <PropertyPopup
          selectedProperty={selectedProperty}
          onClose={handleClosePropertyDetail}
          mapRef={popupMapRef}
        />
      )}
    </StandardLayout>
  );
};

export default Home;
