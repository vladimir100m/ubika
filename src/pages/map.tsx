import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';
import { PropertyCard } from '../components';
import axios from 'axios';
import { Loader } from '@googlemaps/js-api-loader';
import { Property, Geocode } from '../types'; // Import Property and Geocode types

const MapPage: React.FC = () => {
  const router = useRouter();
  const [address, setAddress] = useState<string | null>(null);
  const [propertyLocations, setPropertyLocations] = useState<Property[]>([]); // Typed state
  const [mapCenter, setMapCenter] = useState<Geocode>({ lat: -34.5897318, lng: -58.4232065 });
  const [markers, setMarkers] = useState<{ id: number; lat: number; lng: number }[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
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

  return (
    <div className={styles.container}>
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
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', marginBottom: '1rem', gap: '1rem' }}>
          <input type="text" placeholder="Location" style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
          <input type="number" placeholder="Rooms" style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc', width: '80px' }} />
          <input type="number" placeholder="Bathrooms" style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc', width: '80px' }} />
          <input type="text" placeholder="Price range" style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
          <button style={{ padding: '0.5rem 1rem', borderRadius: '5px', backgroundColor: '#0070f3', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '500', transition: 'background 0.3s ease' }}>
            Apply
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
          <div style={{ flex: 1.5, height: '90vh', position: 'relative' }} className={styles.mapContainer} ref={mapRef}></div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }} className={styles.propertyGrid}>
              {propertyLocations.map((property) => (
                <div 
                  key={property.id}
                  style={{ cursor: 'pointer' }}
                >
                  <PropertyCard
                    image_url={property.image_url}
                    description={property.description}
                    price={`$${property.price}`}
                    address={property.address}
                    rooms={property.rooms}
                    bathrooms={property.bathrooms}
                    squareMeters={property.squareMeters}
                    yearBuilt={property.yearBuilt}
                    latitude={property.latitude ?? property.geocode?.lat}
                    longitude={property.longitude ?? property.geocode?.lng}
                    onClick={() => handlePropertyClick(property)} // Use the onClick prop
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Property detail floating window - Zillow style */}
      {selectedProperty && (
        <div className={styles.propertyDetailOverlay} onClick={handleClosePropertyDetail}>
          <div className={styles.propertyDetailCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={handleClosePropertyDetail}>×</button>
            
            {/* Property Gallery/Header */}
            <div className={styles.propertyDetailHeader}>
              {selectedProperty && (
                <img 
                  src={currentImageIndex === 0 ? selectedProperty.image_url : additionalImages[currentImageIndex - 1]} 
                  alt={`Property image ${currentImageIndex + 1}`} 
                  className={styles.galleryMainImage}
                />
              )}
              
              {/* Gallery Controls */}
              <div className={styles.galleryControls}>
                <button 
                  className={styles.galleryButton} 
                  onClick={() => handleImageChange('prev')}
                >❮</button>
                <button 
                  className={styles.galleryButton} 
                  onClick={() => handleImageChange('next')}
                >❯</button>
              </div>
              
              {/* Thumbnails */}
              <div className={styles.galleryThumbnails}>
                {selectedProperty && (
                  <div 
                    className={styles.galleryThumbnail} 
                    style={currentImageIndex === 0 ? { borderColor: 'white', transform: 'scale(1.05)' } : {}}
                    onClick={() => handleThumbnailClick(0)}
                  >
                    <img src={selectedProperty.image_url} alt="Thumbnail 1" />
                  </div>
                )}
                {additionalImages.map((img, index) => (
                  <div 
                    key={index}
                    className={styles.galleryThumbnail}
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
                      className={`${styles.tabItem} ${activeTab === 'photos' ? styles.active : ''}`}
                      onClick={() => handleTabChange('photos')}
                    >
                      Photos
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