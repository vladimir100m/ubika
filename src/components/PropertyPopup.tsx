import galleryStyles from '../styles/StyledGallery.module.css';
import styles from '../styles/Home.module.css';
import React, {useState, useEffect, useRef, RefObject} from 'react';
import {useAuth} from 'context/AuthContext';
import {useRouter} from 'next/router';
import { Loader } from '@googlemaps/js-api-loader';
import { Property } from '../types';

const additionalImages = [
  '/properties/casa-moderna.jpg',
  '/properties/casa-lago.jpg',
  '/properties/casa-campo.jpg',
  '/properties/villa-lujo.jpg',
  '/properties/cabana-playa.jpg',
  '/properties/casa-playa.jpg',
  '/properties/casa-colonial.jpg'
];
  

export default function PropertyPopup({ 
  selectedProperty, 
  onClose, 
  mapRef 
}: { 
  selectedProperty: Property & { isFavorite?: boolean }; 
  onClose: () => void; 
  mapRef: RefObject<HTMLDivElement | null>;
}) {
  const router = useRouter();
  const isFavorite = selectedProperty.isFavorite || false;
  const [activeTab, setActiveTab] = useState('overview');
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // References for each section for smooth scrolling
  const overviewRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const mapLocationRef = useRef<HTMLDivElement>(null);
  const schoolsRef = useRef<HTMLDivElement>(null);

  // Setup intersection observer to update active tab based on scroll position
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '-80px 0px 0px 0px', // Consider the sticky header
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id === 'overview-section') setActiveTab('overview');
          else if (id === 'details-section') setActiveTab('details');
          else if (id === 'map-section') setActiveTab('map');
          else if (id === 'schools-section') setActiveTab('schools');
        }
      });
    }, options);

    // Observe all section refs
    if (overviewRef.current) observer.observe(overviewRef.current);
    if (detailsRef.current) observer.observe(detailsRef.current);
    if (mapLocationRef.current) observer.observe(mapLocationRef.current);
    if (schoolsRef.current) observer.observe(schoolsRef.current);

    return () => {
      if (overviewRef.current) observer.unobserve(overviewRef.current);
      if (detailsRef.current) observer.unobserve(detailsRef.current);
      if (mapLocationRef.current) observer.unobserve(mapLocationRef.current);
      if (schoolsRef.current) observer.unobserve(schoolsRef.current);
    };
  }, []);

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    
    // Scroll to the appropriate section when tab is clicked
    switch(tabName) {
      case 'overview':
        overviewRef.current?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'details':
        detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'map':
        mapLocationRef.current?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'schools':
        schoolsRef.current?.scrollIntoView({ behavior: 'smooth' });
        break;
      default:
        break;
    }
  };
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth(); // Get user from AuthContext
  
  // Initialize Google Maps when the component loads
  useEffect(() => {
    if (!mapInitialized && mapRef && mapRef.current) {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
      });
      
      loader.load().then(() => {
        if (mapRef.current) {
          const map = new google.maps.Map(mapRef.current, {
            center: {
              lat: selectedProperty.geocode?.lat || selectedProperty.latitude || 0,
              lng: selectedProperty.geocode?.lng || selectedProperty.longitude || 0,
            },
            zoom: 15,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
          });
          
          // Add a marker for the property
          new google.maps.Marker({
            position: {
              lat: selectedProperty.geocode?.lat || selectedProperty.latitude || 0,
              lng: selectedProperty.geocode?.lng || selectedProperty.longitude || 0,
            },
            map,
            title: selectedProperty.address,
            animation: google.maps.Animation.DROP
          });
          
          setMapInitialized(true);
        }
      }).catch(error => {
        console.error("Error loading Google Maps:", error);
      });
    }
  }, [mapInitialized, mapRef, selectedProperty]);
  
  // Handler for saving/unsaving a property
  const handleSaveProperty = () => {
    if (!user) {
      // Redirect to login if not authenticated
      router.push('/login?redirect=/map');
      return;
    }
  }

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
  
  return (
        <div className={styles.propertyDetailOverlay} onClick={onClose}>
          <div className={styles.propertyDetailCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={onClose}>×</button>
            
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
                
                {/* Tabs Navigation - Sticky at the top */}
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
                
                {/* All content sections displayed one after another */}
                <div style={{ backgroundColor: 'white' }}>
                  {/* Overview section */}
                  <div ref={overviewRef} id="overview-section" style={{ padding: '24px', marginBottom: '40px' }}>
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
                            <span>${(parseFloat(selectedProperty.price) * 1.05).toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                            <span style={{ color: '#e4002b' }}>-5.0%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Facts and features section */}
                  <div ref={detailsRef} id="details-section" style={{ padding: '24px', marginBottom: '40px' }}>
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
                  
                  {/* Location section */}
                  <div ref={mapLocationRef} id="map-section" style={{ marginBottom: '40px' }}>
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
                  
                  {/* Schools section */}
                  <div ref={schoolsRef} id="schools-section" style={{ padding: '24px', marginBottom: '40px' }}>
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
        </div>);
}
