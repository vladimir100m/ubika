import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';
import galleryStyles from '../styles/StyledGallery.module.css'; // Import as CSS module
import mobileStyles from '../styles/Mobile.module.css';
import { PropertyCard } from '../components';
import axios from 'axios';
import { Loader } from '@googlemaps/js-api-loader';
import { Property, Geocode } from '../types'; // Import Property and Geocode types
import useMediaQuery from '../utils/useMediaQuery';
import { useAuth } from '../context/AuthContext'; // Import AuthContext to check login state

const MapPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth(); // Get user from AuthContext
  const [propertyLocations, setPropertyLocations] = useState<Property[]>([]); // Typed state
  const [mapCenter, setMapCenter] = useState<Geocode>({ lat: -34.5897318, lng: -58.4232065 });
  const [markers, setMarkers] = useState<{ id: number; lat: number; lng: number }[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false); // Track favorite status
  const [drawerOpen, setDrawerOpen] = useState(false); // Mobile drawer state
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state
  
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

  useEffect(() => {
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
      
      {/* Property detail floating window - Zillow style */}
      {selectedProperty && (
        <div className={styles.propertyDetailOverlay} onClick={handleClosePropertyDetail}>
          <div className={styles.propertyDetailCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={handleClosePropertyDetail}>×</button>
            
            {/* Favorite button - Zillow style */}
            <button 
              className={`${galleryStyles.favoriteButton} ${isFavorite ? galleryStyles.favoriteActive : ''}`} 
              onClick={(e) => {
                e.stopPropagation();
                handleSaveProperty();
              }}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              style={{
                top: '15px',
                right: '60px',
                zIndex: 50,
                width: '46px',
                height: '46px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                  stroke={isFavorite ? "transparent" : "currentColor"}
                  strokeWidth="2"
                  fill={isFavorite ? "#e4002b" : "transparent"}
                />
              </svg>
            </button>
            
            <div className={styles.propertyDetailHeader} style={{ height: '420px' }}>
              {/* Main image carousel - Zillow style */}
              <div 
                className={`${styles.styledGallery} ${galleryStyles.styledGallery}`} 
                style={{ 
                  position: 'relative', 
                  height: '100%', 
                  width: '100%',
                  display: 'block',
                  overflow: 'hidden',
                  backgroundColor: '#f7f7f7'
                }}
              >
                {/* Main large image */}
                {selectedProperty && (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden'
                  }}>
                    <img 
                      src={currentImageIndex === 0 ? selectedProperty.image_url : additionalImages[currentImageIndex - 1]} 
                      alt={`Property image ${currentImageIndex + 1}`} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onClick={toggleGalleryView}
                    />
                    
                    {/* Navigation arrows - Zillow style */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageChange('prev');
                      }}
                      style={{ 
                        position: 'absolute', 
                        left: '20px', 
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: '#2a2a33',
                        border: 'none',
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 20,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      ‹
                    </button>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageChange('next');
                      }}
                      style={{ 
                        position: 'absolute', 
                        right: '20px', 
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: '#2a2a33',
                        border: 'none',
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 20,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      ›
                    </button>
                  </div>
                )}
                
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
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      color: '#2a2a33',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M4 16l4-4 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 14l2-2 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="18" cy="6" r="2" fill="currentColor" />
                    </svg>
                    {additionalImages.length + 1} Photos
                  </button>
                </div>
                
                {/* Photo counter - Zillow style */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: '16px', 
                  left: '16px', 
                  zIndex: 5,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '14px'
                }}>
                  {currentImageIndex + 1} of {additionalImages.length + 1}
                </div>
              </div>
            </div>
            <div className={styles.propertyDetailContent} style={{ padding: '0' }}>
              <div className={styles.propertyDetailBody} style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Property Basic Info - Zillow style */}
                <div className={styles.propertyDetailInfo} style={{ 
                  padding: '24px', 
                  borderBottom: '1px solid #e9e9e9',
                  backgroundColor: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span style={{ 
                        backgroundColor: '#e4002b', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: '600',
                        display: 'inline-block',
                        marginBottom: '8px'
                      }}>For Sale</span>
                      <h1 style={{ 
                        fontSize: '28px', 
                        fontWeight: '600', 
                        color: '#2a2a33', 
                        margin: '0 0 8px 0',
                        lineHeight: '1.2'
                      }}>${selectedProperty.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button style={{ 
                        backgroundColor: '#1277e1', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        padding: '10px 16px', 
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}>
                        Contact Agent
                      </button>
                      <button style={{ 
                        backgroundColor: 'white', 
                        color: '#2a2a33', 
                        border: '1px solid #a7a6ab', 
                        borderRadius: '4px', 
                        padding: '10px 16px', 
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}>
                        Share
                      </button>
                    </div>
                  </div>
                  <h2 style={{ 
                    fontSize: '16px',
                    fontWeight: '400', 
                    color: '#2a2a33', 
                    margin: '0 0 4px 0' 
                  }}>{selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip_code}</h2>
                  
                  {/* Property Stats - Zillow style */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '24px', 
                    margin: '16px 0',
                    fontSize: '16px',
                    color: '#2a2a33'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', marginRight: '4px' }}>{selectedProperty.rooms}</span>
                      <span>beds</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', marginRight: '4px' }}>{selectedProperty.bathrooms}</span>
                      <span>baths</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', marginRight: '4px' }}>{selectedProperty.squareMeters}</span>
                      <span>sqft</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', marginRight: '4px' }}>{selectedProperty.type || 'House'}</span>
                    </div>
                    {selectedProperty.yearBuilt && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600', marginRight: '4px' }}>Built {selectedProperty.yearBuilt}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Tabs Navigation - Zillow style */}
                <div style={{ 
                  backgroundColor: 'white', 
                  borderBottom: '1px solid #e9e9e9',
                  position: 'sticky',
                  top: '0',
                  zIndex: 10
                }}>
                  <ul style={{ 
                    display: 'flex', 
                    listStyle: 'none', 
                    margin: '0',
                    padding: '0 24px',
                    borderBottom: '1px solid #e9e9e9'
                  }}>
                    <li 
                      style={{ 
                        padding: '16px 0', 
                        marginRight: '32px',
                        borderBottom: activeTab === 'overview' ? '3px solid #1277e1' : '3px solid transparent',
                        color: activeTab === 'overview' ? '#1277e1' : '#2a2a33',
                        fontWeight: activeTab === 'overview' ? '700' : '400',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleTabChange('overview')}
                    >
                      Overview
                    </li>
                    <li 
                      style={{ 
                        padding: '16px 0', 
                        marginRight: '32px',
                        borderBottom: activeTab === 'details' ? '3px solid #1277e1' : '3px solid transparent',
                        color: activeTab === 'details' ? '#1277e1' : '#2a2a33',
                        fontWeight: activeTab === 'details' ? '700' : '400',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleTabChange('details')}
                    >
                      Facts and features
                    </li>
                    <li 
                      style={{ 
                        padding: '16px 0', 
                        marginRight: '32px',
                        borderBottom: activeTab === 'map' ? '3px solid #1277e1' : '3px solid transparent',
                        color: activeTab === 'map' ? '#1277e1' : '#2a2a33',
                        fontWeight: activeTab === 'map' ? '700' : '400',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleTabChange('map')}
                    >
                      Location
                    </li>
                    <li 
                      style={{ 
                        padding: '16px 0', 
                        marginRight: '32px',
                        borderBottom: activeTab === 'schools' ? '3px solid #1277e1' : '3px solid transparent',
                        color: activeTab === 'schools' ? '#1277e1' : '#2a2a33',
                        fontWeight: activeTab === 'schools' ? '700' : '400',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleTabChange('schools')}
                    >
                      Schools
                    </li>
                  </ul>
                </div>
                {/* Tab Content - Zillow style */}
                <div style={{ 
                  padding: '24px', 
                  backgroundColor: 'white',
                  display: activeTab === 'overview' ? 'block' : 'none'
                }}>
                  {/* Overview tab - Zillow style */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    {/* Left column */}
                    <div>
                      {/* Description Section */}
                      <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ 
                          fontSize: '20px', 
                          fontWeight: '600', 
                          marginBottom: '16px',
                          color: '#2a2a33'
                        }}>Overview</h3>
                        <p style={{ 
                          fontSize: '16px', 
                          lineHeight: '1.5', 
                          color: '#2a2a33',
                          whiteSpace: 'pre-line'
                        }}>{selectedProperty.description || `This beautiful ${selectedProperty.type || 'property'} features ${selectedProperty.rooms} bedrooms and ${selectedProperty.bathrooms} bathrooms across ${selectedProperty.squareMeters} square feet of living space. Located in a desirable neighborhood in ${selectedProperty.city}, ${selectedProperty.state}, this home offers easy access to local amenities, schools, and transportation.`}</p>
                      </div>
                      
                      {/* Features Section */}
                      <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ 
                          fontSize: '20px', 
                          fontWeight: '600', 
                          marginBottom: '16px',
                          color: '#2a2a33'
                        }}>Home Features</h3>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                          gap: '16px'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px'
                          }}>
                            <span style={{ 
                              color: '#1277e1', 
                              fontSize: '20px',
                              lineHeight: 1
                            }}>•</span>
                            <span>Air Conditioning</span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px'
                          }}>
                            <span style={{ 
                              color: '#1277e1', 
                              fontSize: '20px',
                              lineHeight: 1
                            }}>•</span>
                            <span>Heating</span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px'
                          }}>
                            <span style={{ 
                              color: '#1277e1', 
                              fontSize: '20px',
                              lineHeight: 1
                            }}>•</span>
                            <span>Garage</span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px'
                          }}>
                            <span style={{ 
                              color: '#1277e1', 
                              fontSize: '20px',
                              lineHeight: 1
                            }}>•</span>
                            <span>Swimming Pool</span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px'
                          }}>
                            <span style={{ 
                              color: '#1277e1', 
                              fontSize: '20px',
                              lineHeight: 1
                            }}>•</span>
                            <span>Garden</span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px'
                          }}>
                            <span style={{ 
                              color: '#1277e1', 
                              fontSize: '20px',
                              lineHeight: 1
                            }}>•</span>
                            <span>Balcony</span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px'
                          }}>
                            <span style={{ 
                              color: '#1277e1', 
                              fontSize: '20px',
                              lineHeight: 1
                            }}>•</span>
                            <span>Fireplace</span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px'
                          }}>
                            <span style={{ 
                              color: '#1277e1', 
                              fontSize: '20px',
                              lineHeight: 1
                            }}>•</span>
                            <span>Hardwood Floor</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right column - Zillow style */}
                    <div>
                      {/* Contact form - Zillow style */}
                      <div style={{ 
                        border: '1px solid #e9e9e9', 
                        borderRadius: '4px',
                        padding: '16px',
                        marginBottom: '24px'
                      }}>
                        <h3 style={{ 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          marginBottom: '16px',
                          color: '#2a2a33',
                          textAlign: 'center'
                        }}>Contact an agent about this home</h3>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <input 
                            type="text" 
                            placeholder="Your Name" 
                            style={{ 
                              width: '100%', 
                              padding: '12px', 
                              border: '1px solid #ddd', 
                              borderRadius: '4px',
                              fontSize: '14px'
                            }} 
                          />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <input 
                            type="text" 
                            placeholder="Phone" 
                            style={{ 
                              width: '100%', 
                              padding: '12px', 
                              border: '1px solid #ddd', 
                              borderRadius: '4px',
                              fontSize: '14px'
                            }} 
                          />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <input 
                            type="email" 
                            placeholder="Email" 
                            style={{ 
                              width: '100%', 
                              padding: '12px', 
                              border: '1px solid #ddd', 
                              borderRadius: '4px',
                              fontSize: '14px'
                            }} 
                          />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <textarea 
                            placeholder="I'm interested in this property" 
                            rows={4}
                            style={{ 
                              width: '100%', 
                              padding: '12px', 
                              border: '1px solid #ddd', 
                              borderRadius: '4px',
                              fontSize: '14px', 
                              resize: 'none'
                            }} 
                          />
                        </div>
                        <button 
                          style={{ 
                            width: '100%',
                            backgroundColor: '#1277e1', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            padding: '12px', 
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          Contact Agent
                        </button>
                      </div>
                      
                      {/* Price History - Zillow style */}
                      <div style={{ 
                        border: '1px solid #e9e9e9', 
                        borderRadius: '4px',
                        padding: '16px',
                        marginBottom: '24px'
                      }}>
                        <h3 style={{ 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          marginBottom: '16px',
                          color: '#2a2a33'
                        }}>Price History</h3>
                        
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          borderBottom: '1px solid #e9e9e9',
                          paddingBottom: '8px',
                          marginBottom: '8px',
                          fontSize: '14px',
                          color: '#767676'
                        }}>
                          <span>DATE</span>
                          <span>PRICE</span>
                          <span>CHANGE</span>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          paddingBottom: '8px',
                          marginBottom: '8px',
                          fontSize: '14px'
                        }}>
                          <span>May 1, 2025</span>
                          <span>${selectedProperty.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                          <span>--</span>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          paddingBottom: '8px',
                          marginBottom: '8px',
                          fontSize: '14px'
                        }}>
                          <span>Jan 15, 2025</span>
                          <span>${(selectedProperty.price * 1.05).toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                          <span style={{ color: '#e4002b' }}>-5.0%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Facts and features tab - Zillow style */}
                <div style={{ 
                  padding: '24px', 
                  backgroundColor: 'white',
                  display: activeTab === 'details' ? 'block' : 'none'
                }}>
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ 
                      fontSize: '20px', 
                      fontWeight: '600', 
                      marginBottom: '16px',
                      color: '#2a2a33'
                    }}>Facts and features</h3>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '24px'
                    }}>
                      {/* Interior details */}
                      <div style={{ 
                        border: '1px solid #e9e9e9', 
                        borderRadius: '4px',
                        padding: '16px'
                      }}>
                        <h4 style={{ 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          marginBottom: '16px',
                          color: '#2a2a33',
                          borderBottom: '1px solid #e9e9e9',
                          paddingBottom: '8px'
                        }}>Interior details</h4>
                        
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            marginBottom: '8px'
                          }}>Bedrooms and bathrooms</div>
                          
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '14px',
                            marginBottom: '4px'
                          }}>
                            <span>Bedrooms</span>
                            <span>{selectedProperty.rooms}</span>
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '14px',
                            marginBottom: '4px'
                          }}>
                            <span>Bathrooms</span>
                            <span>{selectedProperty.bathrooms}</span>
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '14px',
                            marginBottom: '4px'
                          }}>
                            <span>Full bathrooms</span>
                            <span>{Math.floor(selectedProperty.bathrooms)}</span>
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '14px'
                          }}>
                            <span>Half bathrooms</span>
                            <span>{selectedProperty.bathrooms % 1 > 0 ? 1 : 0}</span>
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            marginBottom: '8px'
                          }}>Heating and cooling</div>
                          
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            marginBottom: '4px',
                            fontSize: '14px'
                          }}>
                            <span style={{ 
                              color: '#1277e1', 
                              fontSize: '16px'
                            }}>•</span>
                            <span>Air conditioning</span>
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            fontSize: '14px'
                          }}>
                            <span style={{ 
                              color: '#1277e1', 
                              fontSize: '16px'
                            }}>•</span>
                            <span>Heating system</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Property details */}
                      <div style={{ 
                        border: '1px solid #e9e9e9', 
                        borderRadius: '4px',
                        padding: '16px'
                      }}>
                        <h4 style={{ 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          marginBottom: '16px',
                          color: '#2a2a33',
                          borderBottom: '1px solid #e9e9e9',
                          paddingBottom: '8px'
                        }}>Property details</h4>
                        
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            marginBottom: '8px'
                          }}>Property information</div>
                          
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '14px',
                            marginBottom: '4px'
                          }}>
                            <span>Property type</span>
                            <span>{selectedProperty.type || 'Single Family'}</span>
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '14px',
                            marginBottom: '4px'
                          }}>
                            <span>Year built</span>
                            <span>{selectedProperty.yearBuilt || '2010'}</span>
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '14px'
                          }}>
                            <span>Square feet</span>
                            <span>{selectedProperty.squareMeters}</span>
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            marginBottom: '8px'
                          }}>Construction details</div>
                          
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            marginBottom: '4px',
                            fontSize: '14px'
                          }}>
                            <span style={{ 
                              color: '#1277e1', 
                              fontSize: '16px'
                            }}>•</span>
                            <span>Hardwood floors</span>
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            fontSize: '14px'
                          }}>
                            <span style={{ 
                              color: '#1277e1', 
                              fontSize: '16px'
                            }}>•</span>
                            <span>Fireplace</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Outdoor features */}
                      <div style={{ 
                        border: '1px solid #e9e9e9', 
                        borderRadius: '4px',
                        padding: '16px'
                      }}>
                        <h4 style={{ 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          marginBottom: '16px',
                          color: '#2a2a33',
                          borderBottom: '1px solid #e9e9e9',
                          paddingBottom: '8px'
                        }}>Outdoor features</h4>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          marginBottom: '4px',
                          fontSize: '14px'
                        }}>
                          <span style={{ 
                            color: '#1277e1', 
                            fontSize: '16px'
                          }}>•</span>
                          <span>Swimming pool</span>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          marginBottom: '4px',
                          fontSize: '14px'
                        }}>
                          <span style={{ 
                            color: '#1277e1', 
                            fontSize: '16px'
                          }}>•</span>
                          <span>Garden</span>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          fontSize: '14px'
                        }}>
                          <span style={{ 
                            color: '#1277e1', 
                            fontSize: '16px'
                          }}>•</span>
                          <span>Garage</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Location tab - Zillow style */}
                <div style={{ 
                  backgroundColor: 'white',
                  display: activeTab === 'map' ? 'block' : 'none'
                }}>
                  {/* Google Maps integration - show property location */}
                  <div style={{ width: '100%', height: '500px', position: 'relative' }}>
                    <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
                  </div>
                  
                  <div style={{ padding: '24px' }}>
                    <h3 style={{ 
                      fontSize: '20px', 
                      fontWeight: '600', 
                      marginBottom: '16px',
                      color: '#2a2a33'
                    }}>Neighborhood</h3>
                    <p style={{ 
                      fontSize: '16px', 
                      lineHeight: '1.5', 
                      color: '#2a2a33',
                      marginBottom: '24px'
                    }}>
                      This property is located in {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip_code}, a desirable neighborhood with easy access to schools, shopping, and public transportation.
                    </p>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '24px'
                    }}>
                      <div style={{ 
                        border: '1px solid #e9e9e9', 
                        borderRadius: '4px',
                        padding: '16px'
                      }}>
                        <h4 style={{ 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          marginBottom: '16px',
                          color: '#2a2a33'
                        }}>Transportation</h4>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: '8px',
                          marginBottom: '12px'
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: '2px' }}>
                            <path d="M8 5H16C17.1046 5 18 5.89543 18 7V19C18 20.1046 17.1046 21 16 21H8C6.89543 21 6 20.1046 6 19V7C6 5.89543 6.89543 5 8 5Z" stroke="#1277e1" strokeWidth="2" />
                            <path d="M6 9H18" stroke="#1277e1" strokeWidth="2" />
                            <path d="M9 17H15" stroke="#1277e1" strokeWidth="2" />
                          </svg>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600' }}>Public Transportation</div>
                            <div style={{ fontSize: '14px' }}>10 minute walk to nearest subway station</div>
                          </div>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: '8px'
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: '2px' }}>
                            <path d="M5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5Z" stroke="#1277e1" strokeWidth="2" />
                            <path d="M3 9H21" stroke="#1277e1" strokeWidth="2" />
                            <path d="M7 15H8" stroke="#1277e1" strokeWidth="2" strokeLinecap="round" />
                            <path d="M12 15H13" stroke="#1277e1" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600' }}>Highway Access</div>
                            <div style={{ fontSize: '14px' }}>5 minute drive to nearest highway</div>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ 
                        border: '1px solid #e9e9e9', 
                        borderRadius: '4px',
                        padding: '16px'
                      }}>
                        <h4 style={{ 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          marginBottom: '16px',
                          color: '#2a2a33'
                        }}>Restaurants & Shopping</h4>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: '8px',
                          marginBottom: '12px'
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: '2px' }}>
                            <path d="M14 3H10C9.44772 3 9 3.44772 9 4V11H15V4C15 3.44772 14.5523 3 14 3Z" stroke="#1277e1" strokeWidth="2" />
                            <path d="M9 7H6C5.44772 7 5 7.44772 5 8V11H9V7Z" stroke="#1277e1" strokeWidth="2" />
                            <path d="M15 7H18C18.5523 7 19 7.44772 19 8V11H15V7Z" stroke="#1277e1" strokeWidth="2" />
                            <path d="M5 11H19V16C19 18.2091 17.2091 20 15 20H9C6.79086 20 5 18.2091 5 16V11Z" stroke="#1277e1" strokeWidth="2" />
                          </svg>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600' }}>Restaurants</div>
                            <div style={{ fontSize: '14px' }}>Variety of dining options within walking distance</div>
                          </div>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: '8px'
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: '2px' }}>
                            <path d="M16 6V4C16 2.89543 15.1046 2 14 2H10C8.89543 2 8 2.89543 8 4V6M3 6H21V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6Z" stroke="#1277e1" strokeWidth="2" />
                          </svg>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600' }}>Shopping</div>
                            <div style={{ fontSize: '14px' }}>Shopping centers and grocery stores nearby</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Schools tab - Zillow style */}
                <div style={{ 
                  padding: '24px', 
                  backgroundColor: 'white',
                  display: activeTab === 'schools' ? 'block' : 'none'
                }}>
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: '600', 
                    marginBottom: '16px',
                    color: '#2a2a33'
                  }}>Nearby Schools in {selectedProperty.city}</h3>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#767676',
                    marginBottom: '24px'
                  }}>School service boundaries are intended to be used as a reference only; they may change and are not guaranteed. Contact the school directly to verify enrollment eligibility.</p>
                  
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      borderBottom: '1px solid #e9e9e9',
                      paddingBottom: '8px',
                      marginBottom: '16px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      <span>ELEMENTARY</span>
                      <span>GRADES</span>
                      <span>DISTANCE</span>
                      <span>RATING</span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '16px',
                      fontSize: '14px'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Springfield Elementary School</div>
                        <div style={{ color: '#767676' }}>Public</div>
                      </div>
                      <div>K-5</div>
                      <div>0.5 miles</div>
                      <div style={{ 
                        backgroundColor: '#1277e1', 
                        color: 'white',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600'
                      }}>9</div>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      borderBottom: '1px solid #e9e9e9',
                      paddingBottom: '8px',
                      marginBottom: '16px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      <span>MIDDLE</span>
                      <span>GRADES</span>
                      <span>DISTANCE</span>
                      <span>RATING</span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '16px',
                      fontSize: '14px'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Springfield Middle School</div>
                        <div style={{ color: '#767676' }}>Public</div>
                      </div>
                      <div>6-8</div>
                      <div>1.2 miles</div>
                      <div style={{ 
                        backgroundColor: '#1277e1', 
                        color: 'white',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600'
                      }}>8</div>
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      borderBottom: '1px solid #e9e9e9',
                      paddingBottom: '8px',
                      marginBottom: '16px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      <span>HIGH</span>
                      <span>GRADES</span>
                      <span>DISTANCE</span>
                      <span>RATING</span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '16px',
                      fontSize: '14px'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Springfield High School</div>
                        <div style={{ color: '#767676' }}>Public</div>
                      </div>
                      <div>9-12</div>
                      <div>2.1 miles</div>
                      <div style={{ 
                        backgroundColor: '#1277e1', 
                        color: 'white',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600'
                      }}>7</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
