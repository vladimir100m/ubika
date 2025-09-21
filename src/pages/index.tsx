import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Banner from '../components/Banner';
import PropertyCard from '../components/PropertyCard';
import PropertyPopup from '../components/PropertyPopup';
import StandardLayout from '../components/StandardLayout';
import { LoadingState, ErrorState, EmptyState, ResultsInfo, PropertySection } from '../components/StateComponents';
import standardStyles from '../styles/StandardComponents.module.css';
import styles from '../styles/Home.module.css';
import { Property } from '../types'; // Import Property type
// Favorite/save feature removed
import { FilterOptions } from '../components/MapFilters';

const Home: React.FC = () => {
  const router = useRouter();
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
        // Build query parameters from router query for filters
        const queryParams = new URLSearchParams();
        
        // Add filter parameters if they exist in the URL
        const filters = ['minPrice', 'maxPrice', 'bedrooms', 'bathrooms', 'propertyType', 'operation', 'zone', 'minArea', 'maxArea'];
        filters.forEach(filter => {
          const value = router.query[filter];
          if (value && typeof value === 'string' && value.trim() !== '') {
            queryParams.append(filter, value);
          }
        });

        const apiUrl = `/api/properties${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await fetch(apiUrl);
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
  }, [router.query, user, isLoading]);

  // TODO: a veces se llama dos veces, unificar con un use effect general
  // Saved status effect removed

  // Function to handle property card click
  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
  };

  const handleClosePropertyDetail = () => {
    setSelectedProperty(null);
  };

  // Function to handle save status changes using enhanced database API
  // Save status handler removed

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
    
    // Update URL which will trigger a re-fetch of properties
    router.push({
      pathname: '/',
      query
    });
  };

  // Function to handle search location changes
  const handleSearchLocationChange = (location: string) => {
    const query: any = { ...router.query };
    
    if (location && location.trim() !== '') {
      query.zone = location;
    } else {
      delete query.zone;
    }
    
    router.push({
      pathname: '/',
      query
    });
  };

  // Get page title based on operation type
  const getPageTitle = () => {
    const operation = router.query.operation as string;
    switch (operation) {
      case 'rent': return 'Properties for Rent';
      case 'sell': return 'Properties for Sale';
      default: return 'Featured Properties';
    }
  };

  const getPageSubtitle = () => {
    const operation = router.query.operation as string;
    switch (operation) {
      case 'rent': return 'Find your perfect rental property in Argentina';
      case 'sell': return 'Discover the best properties for sale in Argentina';
      default: return 'Discover the best properties in Argentina';
    }
  };

  // Convert router query to FilterOptions format for initial filters
  const getInitialFilters = (): Partial<FilterOptions> => {
    const query = router.query;
    return {
      operation: (query.operation as string) || '',
      priceMin: (query.minPrice as string) || '',
      priceMax: (query.maxPrice as string) || '',
      beds: (query.bedrooms as string) || '',
      baths: (query.bathrooms as string) || '',
      homeType: (query.propertyType as string) || '',
      moreFilters: {
        minArea: (query.minArea as string) || '',
        maxArea: (query.maxArea as string) || '',
        yearBuiltMin: '',
        yearBuiltMax: '',
        keywords: []
      }
    };
  };

  return (
    <StandardLayout 
      showFooter={false}
      showMapFilters={true}
      onFilterChange={handleFilterChange}
      onSearchLocationChange={handleSearchLocationChange}
      searchLocation={(router.query.zone as string) || ''}
      initialFilters={getInitialFilters()}
    >
      
      {/* Hero Section */}
      <div className={standardStyles.section}>
        <Banner />
      </div>

      {/* Properties Section */}
      <PropertySection 
        title={getPageTitle()} 
        subtitle={getPageSubtitle()}
      >
        {/* Results Summary */}
        <ResultsInfo 
          count={properties.length}
          loading={loading}
        />
        
        {/* Loading State */}
        {loading && <LoadingState />}
        
        {/* Error State */}
        {error && (
          <ErrorState 
            message={error}
            onRetry={() => router.reload()}
          />
        )}
        
        {/* Properties Grid - use same grid styles as map view */}
        {!loading && !error && properties.length > 0 && (
          <div className={styles.propertyGrid}>
            {properties.slice(0, 6).map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onClick={() => handlePropertyClick(property)}
              />
            ))}
          </div>
        )}
        
        {/* Empty State */}
        {!loading && !error && properties.length === 0 && (
          <EmptyState 
            showClearFilters={true}
            onClearFilters={() => router.push('/')}
          />
        )}
      </PropertySection>

      {/* Property detail popup overlay */}
      {selectedProperty && (
        <PropertyPopup
          mapRef={popupMapRef}
          selectedProperty={selectedProperty}
          onClose={handleClosePropertyDetail}
        />
      )}
    </StandardLayout>
  );
};

export default Home;
