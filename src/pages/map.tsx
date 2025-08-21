import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';
import galleryStyles from '../styles/StyledGallery.module.css'; // Import as CSS module
import mobileStyles from '../styles/Mobile.module.css';
import { SearchFilters } from '../components/SearchBar';
import MapFilters  from '../components/MapFilters';
import axios from 'axios';
import { Loader } from '@googlemaps/js-api-loader';
import { Property, Geocode } from '../types'; // Import Property and Geocode types
import useMediaQuery from '../utils/useMediaQuery';
import PropertyPopup from 'components/PropertyPopup';
import PropertyCard from 'components/PropertyCard';
import Header from 'components/Header';
import { useSession } from 'next-auth/react';
import { checkSavedStatus, toggleSaveProperty } from '../utils/savedPropertiesApi';

const MapPage: React.FC = () => {
  const router = useRouter();
  const [propertyLocations, setPropertyLocations] = useState<Property[]>([]); // Typed state
  const [mapCenter, setMapCenter] = useState<Geocode>({ lat: -34.5897318, lng: -58.4232065 });
  const [markers, setMarkers] = useState<{ id: number; lat: number; lng: number }[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false); // Mobile drawer state
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state
  const [savedPropertyIds, setSavedPropertyIds] = useState<Set<number>>(new Set());
  
  // Read operation filter from query
  const selectedOperation = typeof router.query.operation === 'string' && (router.query.operation === 'buy' || router.query.operation === 'rent')
    ? router.query.operation as 'buy' | 'rent'
    : 'buy';

  const handleOperationChange = (operation: 'buy' | 'rent') => {
    router.push({
      pathname: '/map',
      query: { ...router.query, operation }
    });
  };
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Toggle the mobile drawer
  const toggleMobileDrawer = () => {
    setDrawerOpen(prevState => !prevState);
  };
  
  // Create a ref object for each property card
  const propertyRefs = useRef<{[key: number]: HTMLDivElement | null}>({});
  
  // Function to set the ref for a property card
  const setPropertyRef = (el: HTMLDivElement | null, id: number) => {
    if (el) {
      propertyRefs.current[id] = el;
    }
  };
  
  // Sample additional images for the gallery
  const additionalImages = [
    '/properties/casa-moderna.jpg',
    '/properties/casa-lago.jpg',
    '/properties/casa-campo.jpg',
    '/properties/villa-lujo.jpg',
    '/properties/cabana-playa.jpg',
    '/properties/casa-playa.jpg',
    '/properties/casa-colonial.jpg'
  ];
  
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const { data: session, status: userStatus } = useSession();
  const user = session?.user;
  const userLoading = userStatus === 'loading';

  // Function to toggle favorite status using database API
  const handleFavoriteToggle = async (propertyId: number, newStatus?: boolean) => {
    if (!user) {
      // Redirect to login if user is not authenticated
      router.push('/auth/signin');
      return;
    }

    try {
      const isCurrentlySaved = newStatus !== undefined ? !newStatus : savedPropertyIds.has(propertyId);
      await toggleSaveProperty(propertyId, !isCurrentlySaved);
      
      // Update local state
      setSavedPropertyIds(prevSavedIds => {
        const newSavedIds = new Set(prevSavedIds);
        if (isCurrentlySaved) {
          newSavedIds.delete(propertyId);
        } else {
          newSavedIds.add(propertyId);
        }
        return newSavedIds;
      });
    } catch (error) {
      console.error('Error toggling favorite status:', error);
    }
  };

  useEffect(() => {
    // Fetch properties from the database
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
        console.log('Fetching properties with URL:', apiUrl);
        
        const response = await axios.get<Property[]>(apiUrl);
        if (Array.isArray(response.data)) {
          setPropertyLocations(response.data);
          
          // Check if we have a selectedPropertyId from the URL query
          const selectedPropertyId = router.query.selectedPropertyId;
          if (selectedPropertyId && typeof selectedPropertyId === 'string') {
            const propertyId = parseInt(selectedPropertyId, 10);
            const property = response.data.find(p => p.id === propertyId);
            if (property) {
              // Set the selected property
              setSelectedProperty(property);
              // Center the map on this property if it has geocode
              if (property.geocode) {
                setMapCenter(property.geocode);
              } else if (property.latitude && property.longitude) {
                setMapCenter({ lat: property.latitude, lng: property.longitude });
              }
            }
          }
        } else {
          console.error('Error fetching properties: Data is not an array', response.data);
          setPropertyLocations([]);
          setError('Failed to retrieve property data. Please try again.');
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setPropertyLocations([]);
        setError('An error occurred while fetching properties. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    //
    fetchProperties();
  }, [router.query]);

  useEffect(() => {
    const loadSavedStatus = async () => {
      if (!user) {
        setSavedPropertyIds(new Set());
        return;
      }

      try {
        const savedStatus = await checkSavedStatus(propertyLocations.map(p => p.id));
        const savedIds = new Set<number>();
        if (savedStatus && typeof savedStatus === 'object') {
          Object.entries(savedStatus).forEach(([id, val]) => {
            if (val) savedIds.add(Number(id));
          });
        }
        setSavedPropertyIds(savedIds);
      } catch (error) {
        console.error('Error loading saved properties status:', error);
        
        // Check if it's an auth error
        if (error instanceof Error && error.message.includes('Unauthorized')) {
          // Just set empty set - no need to redirect as this is a background load
          console.log('User not authenticated for saved properties check');
        }
        
        setSavedPropertyIds(new Set());
      }
    };

    // Only load saved status after user loading is complete and we have properties
    if (!userLoading && propertyLocations.length > 0) {
      loadSavedStatus();
    }
  }, [propertyLocations, userLoading])

  useEffect(() => {
    if (propertyLocations.length > 0) {
      const firstProperty = propertyLocations[0];
      if (firstProperty.geocode) {
        setMapCenter(firstProperty.geocode);
      }
      const propertyMarkers = propertyLocations
        .filter((property) => property.geocode)
        .map((property) => ({ id: property.id, ...property.geocode! })); // Added non-null assertion for geocode
      setMarkers(propertyMarkers);
    }
  }, [propertyLocations]);

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places'],
    });

    loader.load().then(() => {
      if (mapRef.current) {
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: mapCenter,
          zoom: 12,
        });

        // Add markers to the map for all properties
        propertyLocations.forEach((property) => {
          if (property.latitude && property.longitude) {
            const marker = new google.maps.Marker({
              position: { lat: property.latitude, lng: property.longitude },
              map: mapInstance.current,
              title: property.address,
            });
            markersRef.current.push(marker);
          }
        });
      }
    });
  }, [propertyLocations, mapCenter]);

  useEffect(() => {
    if (mapInstance.current && markers.length > 0) {
      // Clear existing markers before adding new ones
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      
      markers.forEach((marker) => {
        const propertyId = marker.id;
        const property = propertyLocations.find(p => p.id === propertyId);
        
        if (property) {
          // Format price for display on marker
          const formatPrice = (price: number | undefined) => {
            if (!price) return '';
            if (price >= 1000000) {
              return '$' + (price / 1000000).toFixed(1) + 'M';
            } else if (price >= 1000) {
              return '$' + (price / 1000).toFixed(0) + 'K';
            }
            return '$' + price;
          };
          
          // property.price may come as string; parse to number when possible
          const priceNumber = typeof property.price === 'string' ? parseFloat(property.price.replace(/[^0-9.-]+/g, '')) : property.price;
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
          
          // Add click event to marker to show property details
          gMarker.addListener('click', () => {
            setSelectedProperty(property);
            setCurrentImageIndex(0); // Reset to first image
            
            // Animate the marker when clicked
            if (gMarker.getAnimation() !== null) {
              gMarker.setAnimation(null);
            } else {
              gMarker.setAnimation(google.maps.Animation.BOUNCE);
              setTimeout(() => {
                gMarker.setAnimation(null);
              }, 750);
            }
          });
          
          // Store marker instance
          markersRef.current.push(gMarker);
        }
      });
    }
  }, [markers, propertyLocations]); 

  useEffect(() => {
    const currentAddress = router.query.address;

    if (currentAddress && typeof currentAddress === 'string' && mapInstance.current && window.google && window.google.maps && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: currentAddress }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const geometry = results[0].geometry;
          const location = geometry.location;
          const bounds = geometry.viewport || geometry.bounds; // viewport is often preferred

          if (bounds && mapInstance.current) {
            mapInstance.current.fitBounds(bounds);
          } else if (location && mapInstance.current) {
            mapInstance.current.setCenter(location);
            // Set a default zoom if bounds are not available
            mapInstance.current.setZoom(15); 
          }
        } else {
          console.error(`Geocode was not successful for the following reason: ${status}`);
          setError(`Could not find location: ${currentAddress}`);
        }
      });
    }
  }, [router.query.address]); 

  // Handler for clicking on a property in the list
  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setCurrentImageIndex(0); // Reset to first image
    
    // If we have map and coordinates, center the map on the property
    if (mapInstance.current && property.geocode) {
      mapInstance.current.setCenter(property.geocode);
      mapInstance.current.setZoom(17); // Zoom in closer
      
      // Highlight the corresponding marker
      const marker = markersRef.current.find(marker => 
        marker.getPosition()?.lat() === property.geocode?.lat && 
        marker.getPosition()?.lng() === property.geocode?.lng
      );
      
      if (marker) {
        // Animate the marker
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
          marker.setAnimation(null);
        }, 750);
        
        // Change the marker icon to highlight it
        marker.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#ff4500',
          fillOpacity: 0.9,
          strokeWeight: 2,
          strokeColor: '#ffffff'
        });
        
        // Reset the previously highlighted marker (if any)
        markersRef.current.forEach(m => {
          if (m !== marker) {
            m.setIcon({
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#0070f3',
              fillOpacity: 0.9,
              strokeWeight: 2,
              strokeColor: '#ffffff'
            });
          }
        });
      }
    }
  };

  // Handler to close the property detail window
  const handleClosePropertyDetail = () => {
    setSelectedProperty(null);
    
    // Reset all markers to the default style
    markersRef.current.forEach(marker => {
      marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#0070f3',
        fillOpacity: 0.9,
        strokeWeight: 2,
        strokeColor: '#ffffff'
      });
    });
  };
  
  // Handler for gallery navigation
  const handleImageChange = (direction: 'next' | 'prev') => {
    if (selectedProperty) {
      const allImages = [selectedProperty.image_url, ...additionalImages];
      const totalImages = allImages.length;
      
      if (direction === 'next') {
        setCurrentImageIndex((prev) => (prev + 1) % totalImages);
      } else {
        setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
      }
    }
  };
  
  // Handler for clicking on a thumbnail
  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Add state for floating gallery
  const [showFloatingGallery, setShowFloatingGallery] = useState(false);
  
  // Touch handling for mobile drawer
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };
  
  const handleTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current) return;
    
    const distance = touchEndY.current - touchStartY.current;
    const isSwipeDown = distance > 50;
    
    if (isSwipeDown) {
      setDrawerOpen(false);
    }
    
    // Reset values
    touchStartY.current = null;
    touchEndY.current = null;
  };

  // Handler to close the floating gallery
  const closeFloatingGallery = () => {
    setShowFloatingGallery(false);
  };

  // Handler for search from the map page
  const handleSearch = (address: string, filters?: SearchFilters) => {
    // Build query object
    const query: any = { address };
    
    if (filters) {
      if (filters.minPrice) query.minPrice = filters.minPrice;
      if (filters.maxPrice) query.maxPrice = filters.maxPrice;
      if (filters.bedrooms) query.bedrooms = filters.bedrooms;
      if (filters.bathrooms) query.bathrooms = filters.bathrooms;
      if (filters.propertyType) query.propertyType = filters.propertyType;
      if (filters.operation) query.operation = filters.operation;
      if (filters.zone) query.zone = filters.zone;
      if (filters.minArea) query.minArea = filters.minArea;
      if (filters.maxArea) query.maxArea = filters.maxArea;
    }
    
    // Update the URL which will trigger a re-fetch of properties
    router.push({
      pathname: '/map',
      query
    });
  };

  return (
    <div className={styles.container}>
  <Header 
    selectedOperation={selectedOperation} 
    onOperationChange={handleOperationChange}
  />
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', paddingTop: '80px' }}>
        {/* Enhanced Filter Bar - Zillow Style */}
        <div style={{ marginBottom: '1rem', zIndex: 5 }}>
          <MapFilters 
            onFilterChange={(filters) => {
              // Build query object from filters
              const query: any = {};
              
              if (filters.forSale) query.operation = 'buy';
              if (filters.forRent) query.operation = 'rent';
              if (filters.priceMin) query.minPrice = filters.priceMin;
              if (filters.priceMax) query.maxPrice = filters.priceMax;
              if (filters.beds) query.bedrooms = filters.beds;
              if (filters.baths) query.bathrooms = filters.baths;
              if (filters.homeType) query.propertyType = filters.homeType;
              if (filters.moreFilters.minArea) query.minArea = filters.moreFilters.minArea;
              if (filters.moreFilters.maxArea) query.maxArea = filters.moreFilters.maxArea;
              
              // Update URL which will trigger a re-fetch of properties
              router.push({
                pathname: '/map',
                query
              });
            }}
            onSearchLocationChange={(location) => {
              // Handle location search
              console.log('Searching for location:', location);
              // You can implement geocoding here to center the map on the searched location
              // For now, we'll just log it
            }}
            onRemoveBoundary={() => {
              // Remove any custom boundary and reset to default view
              setMapCenter({ lat: -34.5897318, lng: -58.4232065 });
              // You can add logic here to clear any drawn boundaries on the map
            }}
            initialFilters={{
              forRent: router.query.operation === 'rent',
              forSale: router.query.operation === 'buy' || router.query.operation === 'sale',
              priceMin: router.query.minPrice as string || '',
              priceMax: router.query.maxPrice as string || '',
              beds: router.query.bedrooms as string || '',
              baths: router.query.bathrooms as string || '',
              homeType: router.query.propertyType as string || '',
              moreFilters: {
                minArea: router.query.minArea as string || '',
                maxArea: router.query.maxArea as string || '',
                yearBuiltMin: '',
                yearBuiltMax: '',
                keywords: []
              }
            }}
            propertyCount={propertyLocations.length}
            showBoundaryButton={!!router.query.location}
            searchLocation={router.query.location as string || ''}
          />
        </div>
        <div className={styles.mapAndPropertiesContainer}>
          <div className={styles.mapWrapper}>
            {/* Show loading state while fetching data */}
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading map...</p>
              </div>
            ) : error ? (
              <div className={styles.errorContainer}>
                <p className={styles.errorMessage}>{error}</p>
                <button className={styles.retryButton} onClick={() => router.reload()}>
                  Try Again
                </button>
              </div>
            ) : (
              <>
                {/* Map container to render the Google Map */}
                <div className={styles.mapContainer}>
                  <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
                </div>
              </>
            )}
            
            {/* Mobile floating action button to show properties */}
            {isMobile && (
              <button 
                className={mobileStyles.drawerToggleButton}
                onClick={toggleMobileDrawer}
                aria-label="Show properties"
              >
                <span className={mobileStyles.buttonIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className={mobileStyles.badgeCount}>{propertyLocations.length}</span>
              </button>
            )}
          </div>
          
          {/* Desktop property list */}
          <div className={styles.propertiesListContainer + ' ' + mobileStyles.onlyDesktop}>
            <div className={styles.propertyGrid}>
              {loading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading properties...</p>
                </div>
              ) : error ? (
                <div className={styles.errorContainer}>
                  <p className={styles.errorMessage}>{error}</p>
                  <button className={styles.retryButton} onClick={() => router.reload()}>
                    Try Again
                  </button>
                </div>
              ) : propertyLocations.length > 0 ? (
                <div className={styles.propertiesGrid}>
                  {propertyLocations.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      isFavorite={savedPropertyIds.has(property.id)}
                      onFavoriteToggle={() => handleFavoriteToggle(property.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No properties found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile drawer backdrop */}
          {drawerOpen && isMobile && (
            <div 
              className={mobileStyles.drawerBackdrop} 
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
          )}
          
          {/* Mobile drawer with property list */}
          <div 
            className={
              `${mobileStyles.mobileDrawer} ${drawerOpen ? mobileStyles.open : ''}`
            }
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transition: 'transform 0.3s ease-in-out',
              boxShadow: drawerOpen ? '0px -4px 10px rgba(0, 0, 0, 0.1)' : 'none',
            }}
          >
            <div 
              className={mobileStyles.drawerHandle} 
              onClick={() => setDrawerOpen(false)}
              style={{
                height: '4px',
                width: '40px',
                backgroundColor: '#ccc',
                borderRadius: '2px',
                margin: '10px auto',
              }}
            />
            <div 
              className={
                `${mobileStyles.drawerContent} ${mobileStyles.noScrollbar} ${mobileStyles.touchScrolling}`
              }
              style={{
                padding: '1rem',
                backgroundColor: '#fff',
                borderRadius: '10px 10px 0 0',
              }}
            >
              <div className={mobileStyles.drawerHeader}>
                <h3 
                  className={mobileStyles.drawerTitle}
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                  }}
                >
                  Properties ({propertyLocations.length})
                </h3>
                <button 
                  className={mobileStyles.closeDrawerButton} 
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close property list"
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Mobile filter pills - Zillow style with state management */}
              <div className={mobileStyles.mobileFilterPills} style={{ 
                display: 'flex', 
                gap: '8px', 
                overflowX: 'auto', 
                marginBottom: '1rem',
                padding: '4px'
              }}>
                <button 
                  className={mobileStyles.filterPill} 
                  style={{
                    background: router.query.operation === 'rent' || !router.query.operation ? '#006aff' : 'white',
                    color: router.query.operation === 'rent' || !router.query.operation ? 'white' : '#2a2a33',
                    border: router.query.operation === 'rent' || !router.query.operation ? 'none' : '1px solid #d1d1d5',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    const query = { ...router.query };
                    if (query.operation === 'rent') {
                      query.operation = 'buy';
                    } else {
                      query.operation = 'rent';
                    }
                    router.push({ pathname: '/map', query });
                  }}
                >
                  {router.query.operation === 'buy' || router.query.operation === 'sale' ? 'For Sale' : 'For Rent'}
                </button>
                <button 
                  className={mobileStyles.filterPill} 
                  style={{
                    background: router.query.minPrice || router.query.maxPrice ? '#006aff' : 'white',
                    color: router.query.minPrice || router.query.maxPrice ? 'white' : '#2a2a33',
                    border: router.query.minPrice || router.query.maxPrice ? 'none' : '1px solid #d1d1d5',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  Price
                  {(router.query.minPrice || router.query.maxPrice) && (
                    <span style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'white'
                    }}></span>
                  )}
                </button>
                <button 
                  className={mobileStyles.filterPill} 
                  style={{
                    background: router.query.bedrooms || router.query.bathrooms ? '#006aff' : 'white',
                    color: router.query.bedrooms || router.query.bathrooms ? 'white' : '#2a2a33',
                    border: router.query.bedrooms || router.query.bathrooms ? 'none' : '1px solid #d1d1d5',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  Beds & Baths
                  {(router.query.bedrooms || router.query.bathrooms) && (
                    <span style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'white'
                    }}></span>
                  )}
                </button>
                <button 
                  className={mobileStyles.filterPill} 
                  style={{
                    background: router.query.propertyType ? '#006aff' : 'white',
                    color: router.query.propertyType ? 'white' : '#2a2a33',
                    border: router.query.propertyType ? 'none' : '1px solid #d1d1d5',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  Home Type
                  {router.query.propertyType && (
                    <span style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'white'
                    }}></span>
                  )}
                </button>
                <button 
                  className={mobileStyles.filterPill} 
                  style={{
                    background: router.query.minArea || router.query.maxArea ? '#006aff' : 'white',
                    color: router.query.minArea || router.query.maxArea ? 'white' : '#2a2a33',
                    border: router.query.minArea || router.query.maxArea ? 'none' : '1px solid #d1d1d5',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  More
                  {(router.query.minArea || router.query.maxArea) && (
                    <span style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'white'
                    }}></span>
                  )}
                </button>
              </div>

              {/* Property grid - modified for mobile */}
              <div 
                className={styles.propertyGrid} 
                style={{ gridTemplateColumns: '1fr', gap: '1rem' }}
              >
                {loading ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading properties...</p>
                  </div>
                ) : error ? (
                  <div className={styles.errorContainer}>
                    <p className={styles.errorMessage}>{error}</p>
                    <button className={styles.retryButton} onClick={() => router.reload()}>
                      Try Again
                    </button>
                  </div>
                ) : propertyLocations.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {propertyLocations.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        isFavorite={savedPropertyIds.has(property.id)}
                        onFavoriteToggle={() => handleFavoriteToggle(property.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={mobileStyles.emptyState} style={{ textAlign: 'center', padding: '1rem' }}>
                    <p>No properties found matching your criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Property detail floating window - Zillow style */}
      {selectedProperty && (<PropertyPopup mapRef={mapRef} selectedProperty={selectedProperty} onClose={handleClosePropertyDetail} />)}
      
      {/* Full-screen floating gallery (Zillow style) */}
      {showFloatingGallery && selectedProperty && (
        <div className={galleryStyles.floatingGallery}>
          <button 
            className={galleryStyles.closeGalleryButton} 
            onClick={closeFloatingGallery}
            aria-label="Close gallery"
          >
            ×
          </button>
          
          <div className={galleryStyles.galleryMainContainer}>
            <button 
              className={galleryStyles.galleryNavButton} 
              onClick={() => handleImageChange('prev')}
              aria-label="Previous image"
            >
              ‹
            </button>
            
            <div className={galleryStyles.mainImageContainer}>
              <img 
                src={currentImageIndex === 0 ? selectedProperty.image_url : additionalImages[currentImageIndex - 1]} 
                alt={`Property image ${currentImageIndex + 1}`} 
                className={galleryStyles.mainGalleryImage}
              />
            </div>
            
            <button 
              className={galleryStyles.galleryNavButton} 
              onClick={() => handleImageChange('next')}
              aria-label="Next image"
            >
              ›
            </button>
          </div>
          
          {/* Thumbnails - Zillow style */}
          <div className={galleryStyles.thumbnailsContainer}>
            <div className={galleryStyles.thumbnailsScroller}>
              <div 
                className={`${galleryStyles.thumbnail} ${currentImageIndex === 0 ? galleryStyles.activeThumbnail : ''}`}
                onClick={() => handleThumbnailClick(0)}
                style={{
                  border: currentImageIndex === 0 ? '3px solid #1277e1' : '3px solid transparent',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                <img 
                  src={selectedProperty.image_url} 
                  alt="Property thumbnail 1" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              {additionalImages.map((img, index) => (
                <div 
                  key={index}
                  className={`${galleryStyles.thumbnail} ${currentImageIndex === index + 1 ? galleryStyles.activeThumbnail : ''}`}
                  onClick={() => handleThumbnailClick(index + 1)}
                  style={{
                    border: currentImageIndex === index + 1 ? '3px solid #1277e1' : '3px solid transparent',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                >
                  <img 
                    src={img} 
                    alt={`Property thumbnail ${index + 2}`} 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Counter - Zillow style */}
          <div className={galleryStyles.galleryCounter}>
            {currentImageIndex + 1} of {additionalImages.length + 1}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
