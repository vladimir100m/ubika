import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';
import galleryStyles from '../styles/StyledGallery.module.css'; // Import as CSS module
import mobileStyles from '../styles/Mobile.module.css';
import { PropertyCard } from '../components';
import MobilePropertyCard from '../components/MobilePropertyCard';
import MobileNavigation from '../components/MobileNavigation';
import MobileFilterBar from '../components/MobileFilterBar';
import axios from 'axios';
import { Loader } from '@googlemaps/js-api-loader';
import { Property, Geocode } from '../types'; // Import Property and Geocode types
import useMediaQuery from '../utils/useMediaQuery';
import { useAuth } from '../context/AuthContext'; // Import AuthContext to check login state

const MapPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth(); // Get user from AuthContext
  const [address, setAddress] = useState<string | null>(null);
  const [propertyLocations, setPropertyLocations] = useState<Property[]>([]); // Typed state
  const [mapCenter, setMapCenter] = useState<Geocode>({ lat: -34.5897318, lng: -58.4232065 });
  const [markers, setMarkers] = useState<{ id: number; lat: number; lng: number }[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false); // Track favorite status
  const [drawerOpen, setDrawerOpen] = useState(false); // Mobile drawer state
  const [favorites, setFavorites] = useState<number[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({
    price: '',
    rooms: '',
    type: '',
    features: ''
  });
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Toggle the mobile drawer
  const toggleMobileDrawer = () => {
    setDrawerOpen(prevState => !prevState);
  };
  
  // Add a new state for the property list visibility
  const [mobilePropertyListVisible, setMobilePropertyListVisible] = useState(false);

  // Function to toggle the mobile property list
  const toggleMobilePropertyList = () => {
    setDrawerOpen(!drawerOpen);
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

  useEffect(() => {
    if (router.query.address) {
      setAddress(router.query.address as string);
    }

    // Fetch properties from the database
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<Property[]>('/api/properties'); // Expect Property[]
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

    fetchProperties();
  }, [router.query]);

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
          const gMarker = new google.maps.Marker({
            position: { lat: marker.lat, lng: marker.lng },
            map: mapInstance.current,
            title: `${property.price ? '$' + property.price : ''} - ${property.title || property.address}`,
            animation: google.maps.Animation.DROP,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#0070f3',
              fillOpacity: 0.9,
              strokeWeight: 2,
              strokeColor: '#ffffff'
            },
            label: {
              text: property.price ? '$' + property.price : '',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold'
            }
          });
          
          // Add click event to marker to show property details
          gMarker.addListener('click', () => {
            setSelectedProperty(property);
            setIsFavorite(false); // Reset favorite status for new property
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
    setIsFavorite(false); // Reset favorite status for new property
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
  
  // Handler for tab switching
  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
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

  // Handler to toggle the full-screen gallery view
  const toggleGalleryView = () => {
    setShowFloatingGallery(true);
  };

  // Handler to close the floating gallery
  const closeFloatingGallery = () => {
    setShowFloatingGallery(false);
  };

  // Handler for saving/unsaving a property
  const handleSaveProperty = () => {
    if (!user) {
      // Redirect to login if not authenticated
      router.push('/login?redirect=/map');
      return;
    }
    
    setIsFavorite(!isFavorite);
    // Here you would typically call an API to save/unsave the property
    // For now we're just toggling the state
  };

  // Apply filters based on URL query parameters
  const applyFiltersFromQuery = (properties: Property[]) => {
    if (!router.query) return properties;
    
    return properties.filter(property => {
      // Filter by price range
      if (router.query.minPrice && parseInt(property.price) < parseInt(router.query.minPrice as string)) {
        return false;
      }
      
      if (router.query.maxPrice && parseInt(property.price) > parseInt(router.query.maxPrice as string)) {
        return false;
      }
      
      // Filter by bedrooms
      if (router.query.bedrooms && property.rooms < parseInt(router.query.bedrooms as string)) {
        return false;
      }
      
      // Filter by property type
      if (router.query.propertyType && property.type && 
          property.type.toLowerCase() !== (router.query.propertyType as string).toLowerCase()) {
        return false;
      }
      
      return true;
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.navbar}>
        <div className={styles.logo} onClick={() => router.push('/')}>Ubika</div>
        <nav>
          <a href="#">Buy</a>
          <a href="#">Rent</a>
          <a href="#">Sell</a>
          <a href="#">Mortgage</a>
          {user ? (
            <a href="/saved-properties">Saved Homes</a>
          ) : (
            <a href="/login">Sign In</a>
          )}
        </nav>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', marginBottom: '1rem', gap: '1rem', zIndex: 10 }}>
          <input type="text" placeholder="Location" style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
          <input type="number" placeholder="Rooms" style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc', width: '80px' }} />
          <input type="number" placeholder="Bathrooms" style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc', width: '80px' }} />
          <input type="text" placeholder="Price range" style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
          <button style={{ padding: '0.5rem 1rem', borderRadius: '5px', backgroundColor: '#0070f3', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '500', transition: 'background 0.3s ease' }}>
            Apply
          </button>
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
                {/* Add a map container to render the map */}
                <div ref={mapRef} style={{ width: '100%', height: '500px', marginBottom: '20px' }}></div>
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
                propertyLocations.map((property) => (
                  <div
                    key={property.id}
                    style={{ cursor: 'pointer' }}
                    ref={el => { setPropertyRef(el, property.id); }}
                  >
                    <PropertyCard {...property} onClick={() => handlePropertyClick(property)} />
                  </div>
                ))
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

              {/* Property filters - simplified for mobile */}
              <div className={mobileStyles.mobileFilters} style={{ marginBottom: '1rem' }}>
                <select className={mobileStyles.filterSelect} style={{ marginBottom: '0.5rem' }}>
                  <option value="">Price (Any)</option>
                  <option value="0-100000">Up to $100,000</option>
                  <option value="100000-300000">$100,000 - $300,000</option>
                  <option value="300000-500000">$300,000 - $500,000</option>
                  <option value="500000+">$500,000+</option>
                </select>

                <select className={mobileStyles.filterSelect} style={{ marginBottom: '0.5rem' }}>
                  <option value="">Bedrooms (Any)</option>
                  <option value="1">1+ Bedroom</option>
                  <option value="2">2+ Bedrooms</option>
                  <option value="3">3+ Bedrooms</option>
                  <option value="4">4+ Bedrooms</option>
                </select>

                <select className={mobileStyles.filterSelect}>
                  <option value="">Property Type</option>
                  <option value="House">House</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Condo">Condo</option>
                  <option value="Townhouse">Townhouse</option>
                </select>
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
                  propertyLocations.map((property) => (
                    <div
                      key={property.id}
                      style={{
                        cursor: 'pointer',
                        padding: '1rem',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      }}
                      ref={el => { setPropertyRef(el, property.id); }}
                      onClick={() => {
                        handlePropertyClick(property);
                        setDrawerOpen(false);
                      }}
                    >
                      <PropertyCard {...property} />
                    </div>
                  ))
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
      
      {/* Property detail floating window - Ubika style */}
      {selectedProperty && (
        <div className={styles.propertyDetailOverlay} onClick={handleClosePropertyDetail}>
          <div className={styles.propertyDetailCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={handleClosePropertyDetail}>×</button>
            {/* Favorite button */}
            <button 
              className={`${galleryStyles.favoriteButton} ${isFavorite ? galleryStyles.favoriteActive : ''}`} 
              onClick={(e) => {
                e.stopPropagation();
                handleSaveProperty();
              }}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                  fill="currentColor" 
                />
              </svg>
            </button>
            <div className={styles.propertyDetailHeader}>
              <div className={`${styles.styledGallery} ${galleryStyles.styledGallery}`} style={{ position: 'relative', height: '400px', display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: 'repeat(4, 1fr)', gap: '4px', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Main large image - taking 2/4 of the space and full height */}
                {selectedProperty && (
                  <img 
                    src={currentImageIndex === 0 ? selectedProperty.image_url : additionalImages[currentImageIndex - 1]} 
                    alt={`Property image ${currentImageIndex + 1}`} 
                    className={`${styles.galleryMainImage} ${galleryStyles.galleryMainImageHover}`}
                    style={{ 
                      gridColumn: '1', 
                      gridRow: '1 / span 4', 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      cursor: 'pointer' 
                    }}
                    onClick={toggleGalleryView}
                  />
                )}
                {/* Four smaller images - taking 1/4 of the space each on the right side */}
                {additionalImages.slice(0, 4).map((img, index) => (
                  <img 
                    key={index}
                    src={img} 
                    alt={`Property image ${index + 2}`}
                    className={`${styles.gallerySecondaryImage} ${galleryStyles.gallerySecondaryImage}`}
                    style={{ 
                      gridColumn: '2', 
                      gridRow: index + 1, 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      cursor: 'pointer' 
                    }}
                    onClick={toggleGalleryView}
                  />
                ))}
                
                {/* Zillow-style "View all photos" button */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: '16px', 
                  right: '16px', 
                  zIndex: 5
                }}>
                  <button 
                    onClick={toggleGalleryView}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      backgroundColor: 'rgba(0, 0, 0, 0.6)', 
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M4 16l4-4 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 14l2-2 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="18" cy="6" r="2" fill="currentColor" />
                    </svg>
                    View all {additionalImages.length + 1} photos
                  </button>
                </div>
              </div>
            </div>
            <div className={styles.propertyDetailContent}>
              <div className={styles.propertyDetailBody}>
                {/* Property Basic Info */}
                <div className={styles.propertyDetailInfo}>
                  <span className={styles.propertyStatusBadge}>For Sale</span>
                  <h1 className={styles.propertyTitle}>{selectedProperty.title || 'Beautiful Property'}</h1>
                  <h2 className={styles.propertyPrice}>${selectedProperty.price}</h2>
                  <p className={styles.propertyAddress}>{selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip_code}</p>
                  <div className={styles.propertyStats}>
                    <div className={styles.propertyStat}>
                      <span className={styles.statValue}>{selectedProperty.rooms}</span>
                      <span className={styles.statLabel}>Bedrooms</span>
                    </div>
                    <div className={styles.propertyStat}>
                      <span className={styles.statValue}>{selectedProperty.bathrooms}</span>
                      <span className={styles.statLabel}>Bathrooms</span>
                    </div>
                    <div className={styles.propertyStat}>
                      <span className={styles.statValue}>{selectedProperty.squareMeters}</span>
                      <span className={styles.statLabel}>Square Meters</span>
                    </div>
                    {selectedProperty.yearBuilt && (
                      <div className={styles.propertyStat}>
                        <span className={styles.statValue}>{selectedProperty.yearBuilt}</span>
                        <span className={styles.statLabel}>Year Built</span>
                      </div>
                    )}
                    <div className={styles.propertyStat}>
                      <span className={styles.statValue}>{selectedProperty.type}</span>
                      <span className={styles.statLabel}>Type</span>
                    </div>
                  </div>
                </div>
                {/* Tabs Navigation */}
                <div className={styles.tabsContainer}>
                  <ul className={styles.tabsList}>
                    <li 
                      className={`${styles.tabItem} ${activeTab === 'overview' ? styles.active : ''}`}
                      onClick={() => handleTabChange('overview')}
                    >
                      Overview
                    </li>
                    <li 
                      className={`${styles.tabItem} ${activeTab === 'details' ? styles.active : ''}`}
                      onClick={() => handleTabChange('details')}
                    >
                      Details
                    </li>
                    <li 
                      className={`${styles.tabItem} ${activeTab === 'map' ? styles.active : ''}`}
                      onClick={() => handleTabChange('map')}
                    >
                      Map
                    </li>
                    <li 
                      className={`${styles.tabItem} ${activeTab === 'schools' ? styles.active : ''}`}
                      onClick={() => handleTabChange('schools')}
                    >
                      Schools
                    </li>
                  </ul>
                </div>
                {/* Tab Content */}
                <div className={`${styles.tabContent} ${activeTab === 'overview' ? styles.active : ''}`}>
                  {/* Description Section */}
                  <div>
                    <h3 className={styles.sectionHeading}>Description</h3>
                    <p className={styles.descriptionText}>{selectedProperty.description}</p>
                  </div>
                  {/* Features Section */}
                  <div>
                    <h3 className={styles.sectionHeading}>Features & Amenities</h3>
                    <div className={styles.featuresGrid}>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Air Conditioning</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Heating</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Garage</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Swimming Pool</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Garden</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Balcony</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Fireplace</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Hardwood Floor</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`${styles.tabContent} ${activeTab === 'details' ? styles.active : ''}`}>
                  {/* Property Details - Zillow style */}
                  <div className={styles.propertyDetailsContainer}>
                    <div className={styles.detailsSection}>
                      <h3 className={styles.detailsTitle}>Basic Details</h3>
                      <div className={styles.detailsRow}>
                        <span className={styles.detailsLabel}>Property ID:</span>
                        <span className={styles.detailsValue}>{selectedProperty.id}</span>
                      </div>
                      <div className={styles.detailsRow}>
                        <span className={styles.detailsLabel}>Status:</span>
                        <span className={styles.detailsValue}>For Sale</span>
                      </div>
                      <div className={styles.detailsRow}>
                        <span className={styles.detailsLabel}>Price:</span>
                        <span className={styles.detailsValue}>${selectedProperty.price}</span>
                      </div>
                      <div className={styles.detailsRow}>
                        <span className={styles.detailsLabel}>Address:</span>
                        <span className={styles.detailsValue}>{selectedProperty.address}</span>
                      </div>
                      <div className={styles.detailsRow}>
                        <span className={styles.detailsLabel}>City:</span>
                        <span className={styles.detailsValue}>{selectedProperty.city}</span>
                      </div>
                      <div className={styles.detailsRow}>
                        <span className={styles.detailsLabel}>State:</span>
                        <span className={styles.detailsValue}>{selectedProperty.state}</span>
                      </div>
                      <div className={styles.detailsRow}>
                        <span className={styles.detailsLabel}>ZIP Code:</span>
                        <span className={styles.detailsValue}>{selectedProperty.zip_code}</span>
                      </div>
                    </div>
                    <div className={styles.detailsSection}>
                      <h3 className={styles.detailsTitle}>Property Features</h3>
                      <div className={styles.featuresGrid}>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>✓</span>
                          <span>Air Conditioning</span>
                        </div>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>✓</span>
                          <span>Heating</span>
                        </div>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>✓</span>
                          <span>Garage</span>
                        </div>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>✓</span>
                          <span>Swimming Pool</span>
                        </div>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>✓</span>
                          <span>Garden</span>
                        </div>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>✓</span>
                          <span>Balcony</span>
                        </div>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>✓</span>
                          <span>Fireplace</span>
                        </div>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>✓</span>
                          <span>Hardwood Floor</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.detailsSection}>
                      <h3 className={styles.detailsTitle}>Room Details</h3>
                      <div className={styles.roomDetailsGrid}>
                        <div className={styles.roomDetailItem}>
                          <span className={styles.roomDetailLabel}>Master Bedroom:</span>
                          <span className={styles.roomDetailValue}>N/A</span>
                        </div>
                        <div className={styles.roomDetailItem}>
                          <span className={styles.roomDetailLabel}>Bedroom 2:</span>
                          <span className={styles.roomDetailValue}>N/A</span>
                        </div>
                        <div className={styles.roomDetailItem}>
                          <span className={styles.roomDetailLabel}>Bedroom 3:</span>
                          <span className={styles.roomDetailValue}>N/A</span>
                        </div>
                        <div className={styles.roomDetailItem}>
                          <span className={styles.roomDetailLabel}>Living Room:</span>
                          <span className={styles.roomDetailValue}>N/A</span>
                        </div>
                        <div className={styles.roomDetailItem}>
                          <span className={styles.roomDetailLabel}>Dining Room:</span>
                          <span className={styles.roomDetailValue}>N/A</span>
                        </div>
                        <div className={styles.roomDetailItem}>
                          <span className={styles.roomDetailLabel}>Kitchen:</span>
                          <span className={styles.roomDetailValue}>N/A</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.detailsSection}>
                      <h3 className={styles.detailsTitle}>Utilities & Expenses</h3>
                      <div className={styles.detailsRow}>
                        <span className={styles.detailsLabel}>Property Tax:</span>
                        <span className={styles.detailsValue}>N/A</span>
                      </div>
                      <div className={styles.detailsRow}>
                        <span className={styles.detailsLabel}>HOA Fee:</span>
                        <span className={styles.detailsValue}>N/A</span>
                      </div>
                      <div className={styles.detailsRow}>
                        <span className={styles.detailsLabel}>Insurance:</span>
                        <span className={styles.detailsValue}>N/A</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`${styles.tabContent} ${activeTab === 'map' ? styles.active : ''}`}>
                  {/* Google Maps integration - show property location */}
                  <div style={{ width: '100%', height: '400px', position: 'relative' }}>
                    <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
                  </div>
                </div>
                <div className={`${styles.tabContent} ${activeTab === 'schools' ? styles.active : ''}`}>
                  {/* Schools information - Zillow style */}
                  <div className={styles.schoolsContainer}>
                    <h3 className={styles.schoolsTitle}>Nearby Schools</h3>
                    <div className={styles.schoolItem}>
                      <div className={styles.schoolInfo}>
                        <h4 className={styles.schoolName}>Springfield Elementary School</h4>
                        <p className={styles.schoolDistance}>0.5 miles away</p>
                      </div>
                      <div className={styles.schoolRating}>
                        <span className={styles.ratingValue}>4.5</span>
                        <span className={styles.ratingLabel}>/ 5</span>
                      </div>
                    </div>
                    <div className={styles.schoolItem}>
                      <div className={styles.schoolInfo}>
                        <h4 className={styles.schoolName}>Springfield High School</h4>
                        <p className={styles.schoolDistance}>1.2 miles away</p>
                      </div>
                      <div className={styles.schoolRating}>
                        <span className={styles.ratingValue}>4.7</span>
                        <span className={styles.ratingLabel}>/ 5</span>
                      </div>
                    </div>
                    <div className={styles.schoolItem}>
                      <div className={styles.schoolInfo}>
                        <h4 className={styles.schoolName}>Springfield College</h4>
                        <p className={styles.schoolDistance}>2.1 miles away</p>
                      </div>
                      <div className={styles.schoolRating}>
                        <span className={styles.ratingValue}>4.8</span>
                        <span className={styles.ratingLabel}>/ 5</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
