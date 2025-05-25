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

const MapPage: React.FC = () => {
  const router = useRouter();
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
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  
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
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setPropertyLocations([]);
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
      if (mapRef.current && !mapInstance.current) { // Ensure map is initialized only once
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: mapCenter,
          zoom: 15,
        });
        
        // Handle window resize to ensure map is properly displayed
        const handleResize = () => {
          if (mapInstance.current) {
            google.maps.event.trigger(mapInstance.current, 'resize');
            if (mapCenter) {
              mapInstance.current.setCenter(mapCenter);
            }
          }
        };
        
        window.addEventListener('resize', handleResize);
        
        // Initial trigger for proper map display
        setTimeout(handleResize, 100);
        
        // Clean up event listener
        return () => {
          window.removeEventListener('resize', handleResize);
        };
      }
    }).catch(e => {
      console.error("Error loading Google Maps API", e);
    });
    
    // Cleanup function to prevent issues with HMR or multiple initializations
    return () => {
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
    };
  }, []); // Removed mapCenter from dependencies to avoid re-creating map on center change

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
            title: property.title || property.address,
            animation: google.maps.Animation.DROP,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#0070f3',
              fillOpacity: 0.9,
              strokeWeight: 2,
              strokeColor: '#ffffff'
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
  }, [markers, mapInstance.current, propertyLocations]); // Added propertyLocations to dependencies

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
        }
      });
    }
  }, [router.query.address, mapInstance.current]); // Added mapInstance.current to dependencies

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

  useEffect(() => {
    if (mapInstance.current && selectedProperty) {
      // If we have a selected property with geocode, center the map on it
      if (selectedProperty.geocode) {
        mapInstance.current.setCenter(selectedProperty.geocode);
        mapInstance.current.setZoom(17); // Zoom in closer
      } else if (selectedProperty.latitude && selectedProperty.longitude) {
        mapInstance.current.setCenter({ lat: selectedProperty.latitude, lng: selectedProperty.longitude });
        mapInstance.current.setZoom(17);
      }
      
      // After markers are created and we have a selected property, highlight its marker
      if (markersRef.current.length > 0) {
        setTimeout(() => {
          // Find the marker corresponding to the selected property
          const markerPosition = selectedProperty.geocode || 
            (selectedProperty.latitude && selectedProperty.longitude ? 
              { lat: selectedProperty.latitude, lng: selectedProperty.longitude } : null);
              
          if (markerPosition) {
            const marker = markersRef.current.find(marker => {
              const position = marker.getPosition();
              return position && 
                Math.abs(position.lat() - markerPosition.lat) < 0.0001 && 
                Math.abs(position.lng() - markerPosition.lng) < 0.0001;
            });
            
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
              
              // Reset other markers
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
        }, 500); // Short delay to ensure markers are fully initialized
      }
    }
  }, [selectedProperty, mapInstance.current, markersRef.current]);

  // Add useEffect to scroll to the selected property when it changes
  useEffect(() => {
    // If we have a selected property and a ref for it, scroll to it
    if (selectedProperty && propertyRefs.current[selectedProperty.id]) {
      // Scroll the property into view with a smooth effect
      propertyRefs.current[selectedProperty.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [selectedProperty]);

  return (
    <div className={styles.container}>
      {/* Mobile drawer toggle button */}
      <button
        className={mobileStyles.drawerToggleButton + ' ' + mobileStyles.onlyMobile}
        onClick={() => setDrawerOpen(!drawerOpen)}
      >
        {drawerOpen ? 'Close' : 'Browse Properties'}
      </button>
      <header className={styles.navbar}>
        <div className={styles.logo} onClick={() => router.push('/')}>Ubika</div>
        <nav>
          <a href="#">Buy</a>
          <a href="#">Rent</a>
          <a href="#">Sell</a>
          <a href="#">Mortgage</a>
          <a href="#">Saved Homes</a>
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
            <div className={styles.mapContainer} ref={mapRef}></div>
          </div>
          {/* Desktop property list */}
          <div className={styles.propertiesListContainer + ' ' + mobileStyles.onlyDesktop}>
            <div className={styles.propertyGrid}>
              {propertyLocations.map((property) => (
                <div
                  key={property.id}
                  style={{ cursor: 'pointer' }}
                  ref={el => { setPropertyRef(el, property.id); }}
                >
                  <PropertyCard {...property} onClick={() => handlePropertyClick(property)} />
                </div>
              ))}
            </div>
          </div>
          {/* Mobile drawer with property list */}
          <div className={mobileStyles.mobileDrawer + (drawerOpen ? ' ' + mobileStyles.open : '')}>
            <div className={mobileStyles.drawerHandle} onClick={() => setDrawerOpen(false)} />
            <div className={mobileStyles.drawerContent}>
              <div className={styles.propertyGrid}>
                {propertyLocations.map((property) => (
                  <div
                    key={property.id}
                    style={{ cursor: 'pointer' }}
                    ref={el => { setPropertyRef(el, property.id); }}
                    onClick={() => {
                      handlePropertyClick(property);
                      setDrawerOpen(false);
                    }}
                  >
                    <PropertyCard {...property} />
                  </div>
                ))}
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
                setIsFavorite(!isFavorite);
              }}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                />
              </svg>
            </button>
            
            {/* Property Gallery/Header */}
            <div className={styles.propertyDetailHeader}>
              <div className={`${styles.styledGallery} ${galleryStyles.styledGallery}`}>
                {/* Main large image */}
                {selectedProperty && (
                  <img 
                    src={currentImageIndex === 0 ? selectedProperty.image_url : additionalImages[currentImageIndex - 1]} 
                    alt={`Property image ${currentImageIndex + 1}`} 
                    className={`${styles.galleryMainImage} ${galleryStyles.galleryMainImageHover}`}
                    onClick={() => handleImageChange('next')}
                  />
                )}
                
                {/* Secondary images */}
                {additionalImages.slice(0, 3).map((img, index) => (
                  <img 
                    key={index}
                    src={img} 
                    alt={`Property image ${index + 2}`}
                    className={`${styles.gallerySecondaryImage} ${galleryStyles.gallerySecondaryImage}`}
                    onClick={() => handleThumbnailClick(index + 1)}
                  />
                ))}
              </div>
              
              {/* Gallery Controls */}
              <div className={styles.galleryControls}>
                <button 
                  className={`${styles.galleryButton} ${galleryStyles.galleryButton}`} 
                  onClick={() => handleImageChange('prev')}
                  aria-label="Previous photo"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button 
                  className={`${styles.galleryButton} ${galleryStyles.galleryButton}`} 
                  onClick={() => handleImageChange('next')}
                  aria-label="Next photo"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              {/* Photo count overlay */}
              <div className={`${styles.photoCountOverlay} ${galleryStyles.photoCountOverlay}`}>
                {currentImageIndex + 1} of {additionalImages.length + 1} Photos
              </div>
              
              {/* View all photos button */}
              <button className={`${styles.viewAllPhotosButton} ${galleryStyles.viewAllPhotosButton}`} onClick={() => setActiveTab('photos')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M4 16L8 12L12 16L20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="18" cy="6" r="2" fill="currentColor"/>
                </svg>
                <span>View all photos</span>
              </button>
              
              {/* Thumbnails - keeping them but they'll be hidden by default */}
              <div className={`${styles.galleryThumbnails} ${galleryStyles.galleryThumbnails}`}>
                {selectedProperty && (
                  <div 
                    className={`${styles.galleryThumbnail} ${galleryStyles.galleryThumbnail}`} 
                    style={currentImageIndex === 0 ? { borderColor: 'white', transform: 'scale(1.05)' } : {}}
                    onClick={() => handleThumbnailClick(0)}
                  >
                    <img src={selectedProperty.image_url} alt="Thumbnail 1" />
                  </div>
                )}
                {additionalImages.map((img, index) => (
                  <div 
                    key={index}
                    className={`${styles.galleryThumbnail} ${galleryStyles.galleryThumbnail}`}
                    style={currentImageIndex === index + 1 ? { borderColor: 'white', transform: 'scale(1.05)' } : {}}
                    onClick={() => handleThumbnailClick(index + 1)}
                  >
                    <img src={img} alt={`Thumbnail ${index + 2}`} />
                  </div>
                ))}
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
                
                {/* Tab Content - Overview */}
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
                        <span>Balcony</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Swimming Pool</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Security System</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Map Section */}
                  <div>
                    <h3 className={styles.sectionHeading}>Location</h3>
                    <div className={styles.mapSection}>
                      {(selectedProperty.latitude || selectedProperty.geocode?.lat) && 
                       (selectedProperty.longitude || selectedProperty.geocode?.lng) && (
                        <iframe
                          src={`https://www.google.com/maps?q=${selectedProperty.latitude || selectedProperty.geocode?.lat},${selectedProperty.longitude || selectedProperty.geocode?.lng}&z=15&output=embed`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen={false}
                          loading="lazy"
                          title="Property Location"
                        ></iframe>
                      )}
                    </div>
                  </div>
                  
                  {/* Mortgage Calculator */}
                  <div className={styles.calculatorSection}>
                    <h3 className={styles.sectionHeading}>Mortgage Calculator</h3>
                    <div className={styles.calculatorForm}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Home Price</label>
                        <input 
                          type="text" 
                          className={styles.formInput} 
                          defaultValue={`$${selectedProperty.price}`} 
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Down Payment</label>
                        <input 
                          type="text" 
                          className={styles.formInput} 
                          defaultValue={`$${Math.round(parseInt(selectedProperty.price) * 0.2)}`} 
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Loan Term</label>
                        <input 
                          type="text" 
                          className={styles.formInput} 
                          defaultValue="30 years" 
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Interest Rate</label>
                        <input 
                          type="text" 
                          className={styles.formInput} 
                          defaultValue="5.5%" 
                        />
                      </div>
                    </div>
                    
                    <div className={styles.calculatorResult}>
                      <h4 className={styles.resultHeading}>Your Monthly Payment</h4>
                      <div className={styles.monthlyPayment}>
                        ${Math.round(parseInt(selectedProperty.price) * 0.006)}
                      </div>
                      <div className={styles.paymentDetails}>
                        <div className={styles.paymentItem}>
                          <span className={styles.paymentItemLabel}>Principal & Interest</span>
                          <span className={styles.paymentItemValue}>${Math.round(parseInt(selectedProperty.price) * 0.0045)}</span>
                        </div>
                        <div className={styles.paymentItem}>
                          <span className={styles.paymentItemLabel}>Property Taxes</span>
                          <span className={styles.paymentItemValue}>${Math.round(parseInt(selectedProperty.price) * 0.0008)}</span>
                        </div>
                        <div className={styles.paymentItem}>
                          <span className={styles.paymentItemLabel}>Home Insurance</span>
                          <span className={styles.paymentItemValue}>${Math.round(parseInt(selectedProperty.price) * 0.0004)}</span>
                        </div>
                        <div className={styles.paymentItem}>
                          <span className={styles.paymentItemLabel}>HOA Fees</span>
                          <span className={styles.paymentItemValue}>${Math.round(parseInt(selectedProperty.price) * 0.0003)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Agent Section */}
                  <div className={styles.agentSection}>
                    <img 
                      src="https://randomuser.me/api/portraits/women/44.jpg" 
                      alt="Agent" 
                      className={styles.agentImage} 
                    />
                    <div className={styles.agentInfo}>
                      <h4 className={styles.agentName}>Emma Rodriguez</h4>
                      <p className={styles.agentTitle}>Senior Real Estate Agent</p>
                      <div className={styles.agentContact}>
                        <button className={styles.agentContactButton}>Call</button>
                        <button className={styles.agentContactButton}>Email</button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tab Content - Photos */}
                <div className={`${styles.tabContent} ${activeTab === 'photos' ? styles.active : ''}`}>
                  <h3 className={styles.sectionHeading}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: "8px"}}>
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M3 14L7 10L12 15L21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="18.5" cy="5.5" r="1.5" fill="currentColor"/>
                    </svg>
                    All Photos ({additionalImages.length + 1})
                  </h3>
                  
                  <div className={styles.photosGrid}>
                    <div 
                      className={`${styles.photoGridItem} ${galleryStyles.photoGridItem}`} 
                      onClick={() => {
                        setCurrentImageIndex(0);
                        setActiveTab('overview');
                      }}
                    >
                      <img 
                        src={selectedProperty.image_url} 
                        alt="Property Main" 
                        className={`${styles.photoGridImage} ${galleryStyles.photoGridImage}`}
                      />
                      <div className={`${styles.photoCaption} ${galleryStyles.photoCaption}`}>Main View</div>
                    </div>
                    
                    {additionalImages.map((img, index) => (
                      <div 
                        className={`${styles.photoGridItem} ${galleryStyles.photoGridItem}`} 
                        key={index}
                        onClick={() => {
                          setCurrentImageIndex(index + 1);
                          setActiveTab('overview');
                        }}
                      >
                        <img 
                          src={img} 
                          alt={`Property view ${index + 2}`} 
                          className={`${styles.photoGridImage} ${galleryStyles.photoGridImage}`}
                        />
                        <div className={`${styles.photoCaption} ${galleryStyles.photoCaption}`}>
                          {index === 0 ? 'Living Room' : 
                           index === 1 ? 'Kitchen' : 
                           index === 2 ? 'Master Bedroom' : 
                           'Exterior View'}
                        </div>
                      </div>
                    ))}
                    
                    <div className={styles.photoGridItem}>
                      <img 
                        src="/properties/casa-moderna.jpg" 
                        alt="Additional view" 
                        className={styles.photoGridImage}
                      />
                      <div className={styles.photoCaption}>Bathroom</div>
                    </div>
                    
                    <div className={styles.photoGridItem}>
                      <img 
                        src="/properties/penthouse-lujo.jpg" 
                        alt="Additional view" 
                        className={styles.photoGridImage}
                      />
                      <div className={styles.photoCaption}>Balcony</div>
                    </div>
                  </div>
                </div>
                
                {/* Tab Content - Details */}
                <div className={`${styles.tabContent} ${activeTab === 'details' ? styles.active : ''}`}>
                  <div className={styles.detailsSection}>
                    <h3 className={styles.sectionHeading}>Property Details</h3>
                    
                    <div className={styles.detailsTable}>
                      <div className={styles.detailsRow}>
                        <div className={styles.detailsLabel}>Property Type</div>
                        <div className={styles.detailsValue}>{selectedProperty.type}</div>
                      </div>
                      <div className={styles.detailsRow}>
                        <div className={styles.detailsLabel}>Year Built</div>
                        <div className={styles.detailsValue}>{selectedProperty.yearBuilt || 'Not Available'}</div>
                      </div>
                      <div className={styles.detailsRow}>
                        <div className={styles.detailsLabel}>Square Meters</div>
                        <div className={styles.detailsValue}>{selectedProperty.squareMeters}</div>
                      </div>
                      <div className={styles.detailsRow}>
                        <div className={styles.detailsLabel}>Bedrooms</div>
                        <div className={styles.detailsValue}>{selectedProperty.rooms}</div>
                      </div>
                      <div className={styles.detailsRow}>
                        <div className={styles.detailsLabel}>Bathrooms</div>
                        <div className={styles.detailsValue}>{selectedProperty.bathrooms}</div>
                      </div>
                      <div className={styles.detailsRow}>
                        <div className={styles.detailsLabel}>Heating</div>
                        <div className={styles.detailsValue}>Central</div>
                      </div>
                      <div className={styles.detailsRow}>
                        <div className={styles.detailsLabel}>Cooling</div>
                        <div className={styles.detailsValue}>Central Air</div>
                      </div>
                      <div className={styles.detailsRow}>
                        <div className={styles.detailsLabel}>Parking</div>
                        <div className={styles.detailsValue}>2 Car Garage</div>
                      </div>
                      <div className={styles.detailsRow}>
                        <div className={styles.detailsLabel}>Lot Size</div>
                        <div className={styles.detailsValue}>{Math.round(selectedProperty.squareMeters * 1.2)} m²</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.detailsSection}>
                    <h3 className={styles.sectionHeading}>Interior Features</h3>
                    <div className={styles.featuresGrid}>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Hardwood Floors</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Granite Countertops</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Stainless Steel Appliances</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Walk-in Closet</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Fireplace</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Recessed Lighting</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.detailsSection}>
                    <h3 className={styles.sectionHeading}>Exterior Features</h3>
                    <div className={styles.featuresGrid}>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Swimming Pool</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Patio</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Fenced Yard</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Sprinkler System</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Garden</span>
                      </div>
                      <div className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>Balcony</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.detailsSection}>
                    <h3 className={styles.sectionHeading}>Property History</h3>
                    <div className={styles.historyTable}>
                      <div className={styles.historyHeader}>
                        <div>Date</div>
                        <div>Event</div>
                        <div>Price</div>
                      </div>
                      <div className={styles.historyRow}>
                        <div>May 10, 2025</div>
                        <div>Listed</div>
                        <div>${selectedProperty.price}</div>
                      </div>
                      <div className={styles.historyRow}>
                        <div>Jan 15, 2020</div>
                        <div>Sold</div>
                        <div>${Math.round(parseInt(selectedProperty.price) * 0.8)}</div>
                      </div>
                      <div className={styles.historyRow}>
                        <div>Mar 22, 2015</div>
                        <div>Sold</div>
                        <div>${Math.round(parseInt(selectedProperty.price) * 0.65)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tab Content - Map */}
                <div className={`${styles.tabContent} ${activeTab === 'map' ? styles.active : ''}`}>
                  <div className={styles.mapFullContainer}>
                    {(selectedProperty.latitude || selectedProperty.geocode?.lat) && 
                     (selectedProperty.longitude || selectedProperty.geocode?.lng) && (
                      <iframe
                        src={`https://www.google.com/maps?q=${selectedProperty.latitude || selectedProperty.geocode?.lat},${selectedProperty.longitude || selectedProperty.geocode?.lng}&z=14&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={true}
                        loading="lazy"
                        title="Property Location Map"
                      ></iframe>
                    )}
                  </div>
                  
                  <div className={styles.neighborhoodSection}>
                    <h3 className={styles.sectionHeading}>Neighborhood</h3>
                    <div className={styles.neighborhoodInfo}>
                      <div className={styles.neighborhoodStat}>
                        <div className={styles.statIcon}>🏫</div>
                        <div className={styles.statDetails}>
                          <span className={styles.statValue}>8/10</span>
                          <span className={styles.statLabel}>Schools</span>
                        </div>
                      </div>
                      <div className={styles.neighborhoodStat}>
                        <div className={styles.statIcon}>🛒</div>
                        <div className={styles.statDetails}>
                          <span className={styles.statValue}>9/10</span>
                          <span className={styles.statLabel}>Shopping</span>
                        </div>
                      </div>
                      <div className={styles.neighborhoodStat}>
                        <div className={styles.statIcon}>🚇</div>
                        <div className={styles.statDetails}>
                          <span className={styles.statValue}>7/10</span>
                          <span className={styles.statLabel}>Transportation</span>
                        </div>
                      </div>
                      <div className={styles.neighborhoodStat}>
                        <div className={styles.statIcon}>🍽️</div>
                        <div className={styles.statDetails}>
                          <span className={styles.statValue}>8/10</span>
                          <span className={styles.statLabel}>Restaurants</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.poiSection}>
                    <h3 className={styles.sectionHeading}>Points of Interest Nearby</h3>
                    <div className={styles.poiList}>
                      <div className={styles.poiItem}>
                        <div className={styles.poiIcon}>🏫</div>
                        <div className={styles.poiDetails}>
                          <div className={styles.poiName}>Central Elementary School</div>
                          <div className={styles.poiDistance}>0.5 miles</div>
                        </div>
                      </div>
                      <div className={styles.poiItem}>
                        <div className={styles.poiIcon}>🏥</div>
                        <div className={styles.poiDetails}>
                          <div className={styles.poiName}>Community Hospital</div>
                          <div className={styles.poiDistance}>1.2 miles</div>
                        </div>
                      </div>
                      <div className={styles.poiItem}>
                        <div className={styles.poiIcon}>🛒</div>
                        <div className={styles.poiDetails}>
                          <div className={styles.poiName}>Westfield Shopping Center</div>
                          <div className={styles.poiDistance}>0.8 miles</div>
                        </div>
                      </div>
                      <div className={styles.poiItem}>
                        <div className={styles.poiIcon}>🚇</div>
                        <div className={styles.poiDetails}>
                          <div className={styles.poiName}>Metro Station</div>
                          <div className={styles.poiDistance}>0.3 miles</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tab Content - Schools */}
                <div className={`${styles.tabContent} ${activeTab === 'schools' ? styles.active : ''}`}>
                  <div className={styles.schoolsSection}>
                    <h3 className={styles.sectionHeading}>Nearby Schools</h3>
                    
                    <div className={styles.schoolFilters}>
                      <button className={`${styles.schoolFilterButton} ${styles.active}`}>All Schools</button>
                      <button className={styles.schoolFilterButton}>Elementary</button>
                      <button className={styles.schoolFilterButton}>Middle</button>
                      <button className={styles.schoolFilterButton}>High</button>
                    </div>
                    
                    <div className={styles.schoolsList}>
                      <div className={styles.schoolCard}>
                        <div className={styles.schoolRating}>9/10</div>
                        <div className={styles.schoolInfo}>
                          <h4 className={styles.schoolName}>Lincoln Elementary School</h4>
                          <p className={styles.schoolType}>Public, K-5 • 0.4 miles</p>
                          <div className={styles.schoolStats}>
                            <div className={styles.schoolStat}>
                              <span className={styles.schoolStatLabel}>Students</span>
                              <span className={styles.schoolStatValue}>420</span>
                            </div>
                            <div className={styles.schoolStat}>
                              <span className={styles.schoolStatLabel}>Teachers</span>
                              <span className={styles.schoolStatValue}>32</span>
                            </div>
                            <div className={styles.schoolStat}>
                              <span className={styles.schoolStatLabel}>Student/Teacher</span>
                              <span className={styles.schoolStatValue}>13:1</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.schoolCard}>
                        <div className={styles.schoolRating}>8/10</div>
                        <div className={styles.schoolInfo}>
                          <h4 className={styles.schoolName}>Washington Middle School</h4>
                          <p className={styles.schoolType}>Public, 6-8 • 0.9 miles</p>
                          <div className={styles.schoolStats}>
                            <div className={styles.schoolStat}>
                              <span className={styles.schoolStatLabel}>Students</span>
                              <span className={styles.schoolStatValue}>650</span>
                            </div>
                            <div className={styles.schoolStat}>
                              <span className={styles.schoolStatLabel}>Teachers</span>
                              <span className={styles.schoolStatValue}>45</span>
                            </div>
                            <div className={styles.schoolStat}>
                              <span className={styles.schoolStatLabel}>Student/Teacher</span>
                              <span className={styles.schoolStatValue}>14:1</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.schoolCard}>
                        <div className={styles.schoolRating}>7/10</div>
                        <div className={styles.schoolInfo}>
                          <h4 className={styles.schoolName}>Roosevelt High School</h4>
                          <p className={styles.schoolType}>Public, 9-12 • 1.5 miles</p>
                          <div className={styles.schoolStats}>
                            <div className={styles.schoolStat}>
                              <span className={styles.schoolStatLabel}>Students</span>
                              <span className={styles.schoolStatValue}>1,200</span>
                            </div>
                            <div className={styles.schoolStat}>
                              <span className={styles.schoolStatLabel}>Teachers</span>
                              <span className={styles.schoolStatValue}>80</span>
                            </div>
                            <div className={styles.schoolStat}>
                              <span className={styles.schoolStatLabel}>Student/Teacher</span>
                              <span className={styles.schoolStatValue}>15:1</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.schoolCard}>
                        <div className={styles.schoolRating}>9/10</div>
                        <div className={styles.schoolInfo}>
                          <h4 className={styles.schoolName}>Montessori Academy</h4>
                          <p className={styles.schoolType}>Private, K-8 • 1.1 miles</p>
                          <div className={styles.schoolStats}>
                            <div className={styles.schoolStat}>
                              <span className={styles.schoolStatLabel}>Students</span>
                              <span className={styles.schoolStatValue}>280</span>
                            </div>
                            <div className={styles.schoolStat}>
                              <span className={styles.schoolStatLabel}>Teachers</span>
                              <span className={styles.schoolStatValue}>28</span>
                            </div>
                            <div className={styles.schoolStat}>
                              <span className={styles.schoolStatLabel}>Student/Teacher</span>
                              <span className={styles.schoolStatValue}>10:1</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.schoolMap}>
                    {(selectedProperty.latitude || selectedProperty.geocode?.lat) && 
                     (selectedProperty.longitude || selectedProperty.geocode?.lng) && (
                      <iframe
                        src={`https://www.google.com/maps?q=${selectedProperty.latitude || selectedProperty.geocode?.lat},${selectedProperty.longitude || selectedProperty.geocode?.lng}&z=13&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={false}
                        loading="lazy"
                        title="Schools Map"
                      ></iframe>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Bar */}
              <div className={styles.propertyActionBar}>
                <div className={styles.actionGroup}>
                  <button className={styles.actionButtonPrimary}>Contact Agent</button>
                  <button className={styles.actionButtonSecondary}>Schedule Tour</button>
                </div>
                <div className={styles.actionGroup}>
                  <button className={styles.actionButtonSecondary}>Share</button>
                  <button className={styles.actionButtonSecondary}>Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <footer className={styles.footer}>
        <p>&copy; 2025 Ubika. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MapPage;