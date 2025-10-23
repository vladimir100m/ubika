'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../../styles/Home.module.css';
import standardStyles from '../../styles/StandardComponents.module.css';
import { LoadingState, ErrorState, EmptyState, ResultsInfo, PropertySection, PropertyGrid } from '../../ui/StateComponents';
import PropertyCardGrid from '../../ui/PropertyCardGrid';
import { StandardLayout } from '../../ui';
import axios from 'axios';
import { Loader } from '@googlemaps/js-api-loader';
import { Property, Geocode } from '../../types';
import useMediaQuery from '../../lib/useMediaQuery';
import PropertyPopup from '../../ui/PropertyPopup';
import { FilterOptions } from '../../ui/MapFilters';
import MapFilters from '../../ui/MapFilters';

const MapPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const [properties, setProperties] = useState<Property[]>([]);
  const [mapCenter, setMapCenter] = useState<Geocode>({ lat: -34.5897318, lng: -58.4232065 });
  const [markers, setMarkers] = useState<{ id: number; lat: number; lng: number }[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams(searchParams?.toString() ?? '');
        const apiUrl = `/api/properties?${queryParams.toString()}`;
        
        const response = await axios.get<Property[]>(apiUrl);
        if (Array.isArray(response.data)) {
          setProperties(response.data);
          
          const selectedPropertyId = searchParams?.get('selectedPropertyId');
          if (selectedPropertyId) {
            const propertyId = parseInt(selectedPropertyId, 10);
            const property = response.data.find(p => p.id === propertyId);
            if (property) {
              setSelectedProperty(property);
              if (property.lat && property.lng) {
                setMapCenter({ lat: property.lat, lng: property.lng });
              }
            }
          }
        } else {
          console.error('Error fetching properties: Data is not an array', response.data);
          setProperties([]);
          setError('Failed to retrieve property data. Please try again.');
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
        setError('An error occurred while fetching properties. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [searchParams]);

  useEffect(() => {
    if (properties.length > 0) {
      const firstProperty = properties[0];
      if (firstProperty.lat && firstProperty.lng) {
        setMapCenter({ lat: firstProperty.lat, lng: firstProperty.lng });
      }
      const propertyMarkers = properties
        .filter((property) => property.lat && property.lng)
        .map((property) => ({ id: property.id, lat: property.lat, lng: property.lng }));
      setMarkers(propertyMarkers);
    } else {
      setMarkers([]);
    }
  }, [properties]);

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places'],
    });

    loader.load().then(() => {
      if (mapRef.current && !mapInstance.current) {
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: mapCenter,
          zoom: 12,
        });
      }
    });
  }, [mapCenter]);

  useEffect(() => {
    if (mapInstance.current) {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      properties.forEach((property) => {
        if (property.lat && property.lng) {
          const marker = new google.maps.Marker({
            position: { lat: property.lat, lng: property.lng },
            map: mapInstance.current,
            title: property.address,
          });
          markersRef.current.push(marker);
        }
      });
    }
  }, [properties]);

  useEffect(() => {
    if (mapInstance.current && markers.length > 0) {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      
      markers.forEach((marker) => {
        const propertyId = marker.id;
        const property = properties.find(p => p.id === propertyId);
        
        if (property) {
          const formatPrice = (price: number | undefined) => {
            if (!price) return '';
            if (price >= 1000000) return '$' + (price / 1000000).toFixed(1) + 'M';
            if (price >= 1000) return '$' + (price / 1000).toFixed(0) + 'K';
            return '$' + price;
          };
          
          const priceNumber = property.price;
          const priceLabel = formatPrice(typeof priceNumber === 'number' && !isNaN(priceNumber) ? priceNumber : undefined);
          
          const gMarker = new google.maps.Marker({
            position: { lat: marker.lat, lng: marker.lng },
            map: mapInstance.current,
            title: `${property.price ? '$' + property.price : ''} - ${property.title || property.address}`,
            animation: google.maps.Animation.DROP,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: (property as any).operation === 'rent' ? '#006aff' : '#ff5722',
              fillOpacity: 0.9,
              strokeWeight: 2,
              strokeColor: '#ffffff'
            },
            label: {
              text: priceLabel,
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold'
            }
          });
          
          gMarker.addListener('click', () => {
            setSelectedProperty(property);
          });
          
          markersRef.current.push(gMarker);
        }
      });
    }
  }, [markers, properties]); 

  useEffect(() => {
    const currentAddress = searchParams?.get('address');

    if (currentAddress && mapInstance.current && window.google && window.google.maps && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: currentAddress }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const geometry = results[0].geometry;
          const location = geometry.location;
          const bounds = geometry.viewport || geometry.bounds;

          if (bounds && mapInstance.current) {
            mapInstance.current.fitBounds(bounds);
          } else if (location && mapInstance.current) {
            mapInstance.current.setCenter(location);
            mapInstance.current.setZoom(15); 
          }
        } else {
          console.error(`Geocode was not successful for the following reason: ${status}`);
          setError(`Could not find location: ${currentAddress}`);
        }
      });
    }
  }, [searchParams]); 

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    
    if (mapInstance.current && property.lat && property.lng) {
      mapInstance.current.setCenter({ lat: property.lat, lng: property.lng });
      mapInstance.current.setZoom(17);
      
      const marker = markersRef.current.find(marker => 
        marker.getPosition()?.lat() === property.lat && 
        marker.getPosition()?.lng() === property.lng
      );
      
      if (marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
          marker.setAnimation(null);
        }, 750);
      }
    }
  };

  const handleClosePropertyDetail = () => {
    setSelectedProperty(null);
  };
  
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
    
    const newParams = new URLSearchParams(query).toString();
    router.push(`/map?${newParams}`);
  };

  const handleSearchLocationChange = (location: string) => {
    const currentParams = new URLSearchParams(searchParams?.toString() ?? '');
    if (location && location.trim() !== '') {
      currentParams.set('zone', location);
    } else {
      currentParams.delete('zone');
    }
    router.push(`/map?${currentParams.toString()}`);
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
      showMapFilters={false}
      onFilterChange={handleFilterChange}
      onSearchLocationChange={handleSearchLocationChange}
      searchLocation={searchParams?.get('zone') || ''}
      initialFilters={getInitialFilters()}
    >
      <div className={standardStyles.pageContainer}>
        <div className={styles.mapSection}>
          <div className={styles.mapContainer}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
            {loading && (
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontSize: '12px',
                color: '#666'
              }}>
                Loading map...
              </div>
            )}
          </div>
        </div>
        <div className={styles.propertyListSection}>
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
                  isSaved={false}
                  onSaveToggle={() => {}}
                />
              ) : (
                <EmptyState message="No properties found for this area. Try a different location." />
              )}
            </>
          )}
        </div>
      </div>
      {selectedProperty && (
        <PropertyPopup
          selectedProperty={selectedProperty}
          onClose={handleClosePropertyDetail}
          mapRef={mapRef}
        />
      )}
    </StandardLayout>
  );
};

export default MapPage;
