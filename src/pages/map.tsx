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
import PropertyPopup from 'components/PropertyPopup';
import Header from 'components/Header';

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

  return (
    <div className={styles.container}>
      <Header />
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
