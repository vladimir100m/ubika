import galleryStyles from '../styles/StyledGallery.module.css';
import styles from '../styles/Home.module.css';
import React, {useState, useEffect, useRef, RefObject, useCallback, useMemo} from 'react';
import {useRouter} from 'next/router';
import { useSession } from 'next-auth/react';
import { Loader } from '@googlemaps/js-api-loader';
import { Property } from '../types';
import { getCoverImage, getAllPropertyImages } from '../utils/propertyImages';
import PropertyImageGrid from './PropertyImageGrid';
import { formatNumberWithCommas } from '../utils/format';
import PropertyDetailTabsNav from './PropertyDetailTabsNav';
import PropertyImageCarousel from './PropertyImageCarousel';
// Favorite/save feature removed

interface Neighborhood {
  id: number;
  name: string;
  description: string;
  subway_access: string;
  dining_options: string;
  shopping_access: string;
  highway_access: string;
}

export default function PropertyPopup({ 
  selectedProperty, 
  onClose, 
  mapRef
}: { 
  selectedProperty: Property; 
  onClose: () => void; 
  mapRef: RefObject<HTMLDivElement>;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const [activeTab, setActiveTab] = useState('overview');
  const [descExpanded, setDescExpanded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [neighborhoodData, setNeighborhoodData] = useState<Neighborhood | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [showCarousel, setShowCarousel] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: "I'm interested in this property"
  });
  const overviewRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const mapLocationRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleTabChange = useCallback((tabName: string) => {
    setActiveTab(tabName);
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
    }
  }, []);
  
  // Handler for saving/unsaving a property
  // Favorite/save handlers removed

  // Handler for gallery navigation
  const handleImageChange = useCallback((direction: 'next' | 'prev') => {
    setImageLoading(true);
    const allImages = getAllPropertyImages(selectedProperty);
    const totalImages = allImages.length;
    setCurrentImageIndex(prev => {
      if (direction === 'next') {
        return (prev + 1) % totalImages;
      } else {
        return (prev - 1 + totalImages) % totalImages;
      }
    });
  }, [selectedProperty]);

  // Get operation status badge info
  const getOperationStatusBadge = () => {
    const operationStatus = selectedProperty.operation_status_display || selectedProperty.operation_status;
    const operationStatusId = selectedProperty.operation_status_id;

    // Define colors for different operation types
    const badgeConfig = {
      1: { backgroundColor: '#e4002b', text: operationStatus || 'For Sale' }, // Sale
      2: { backgroundColor: '#2563eb', text: operationStatus || 'For Rent' }, // Rent  
      3: { backgroundColor: '#6b7280', text: operationStatus || 'Not Available' } // Not Available
    };

    return badgeConfig[operationStatusId as keyof typeof badgeConfig] || badgeConfig[1];
  };

  // Handler for clicking on specific images in the grid
  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setShowCarousel(true);
  };

  // Handle contact form actions
  const handleCloseContactForm = () => {
    setShowContactForm(false);
    // Reset form data
    setContactFormData({
      name: '',
      phone: '',
      email: '',
      message: 'I\'m interested in this property'
    });
  };

  const handleContactFormChange = (field: string, value: string) => {
    setContactFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get dynamic grid layout based on number of images (max 3)
  const gridLayout = useMemo(() => {
    const allImages = getAllPropertyImages(selectedProperty);
    const imageCount = Math.min(allImages.length, 3);
    switch (imageCount) {
      case 1:
        return {
          gridTemplateColumns: '1fr',
          gridTemplateRows: '1fr',
          images: allImages.slice(0, 1),
          showViewAllButton: allImages.length > 1,
        };
      case 2:
        return {
          gridTemplateColumns: '2fr 1fr',
          gridTemplateRows: '1fr',
          images: allImages.slice(0, 2),
          showViewAllButton: allImages.length > 2,
        };
      case 3:
      default:
        return {
          gridTemplateColumns: '2fr 1fr',
          gridTemplateRows: '1fr 1fr',
          images: allImages.slice(0, 3),
          showViewAllButton: allImages.length > 3,
        };
    }
  }, [selectedProperty]);

  // Touch handlers for swipe navigation
  // Touch handlers for swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) {
      handleImageChange('next');
    } else if (isRightSwipe) {
      handleImageChange('prev');
    }
  }, [touchStart, touchEnd, handleImageChange]);
  
  return (
    <>
        <div className={styles.propertyDetailOverlay} onClick={onClose}>
          <div className={styles.propertyDetailCard} onClick={(e) => e.stopPropagation()}>
            <div style={{position:'absolute', top:12, right:12, display:'flex', gap:'10px', zIndex:60}}>
              <button 
                onClick={(e)=>{e.stopPropagation(); onClose();}}
                aria-label="Close property popup"
                style={{
                  background:'rgba(255,255,255,0.9)',
                  border:'1px solid rgba(0,0,0,0.1)',
                  backdropFilter:'blur(4px)',
                  width:44, height:44, borderRadius:12,
                  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                  boxShadow:'0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                <span style={{fontSize:22,lineHeight:1}}>×</span>
              </button>
              {/* Favorite/save button removed */}
              <button 
                onClick={(e)=>{e.stopPropagation(); if(navigator.share){navigator.share({title:selectedProperty.title || 'Property', text:selectedProperty.description || 'Check this property', url: window.location.href}).catch(()=>{});} else {navigator.clipboard.writeText(window.location.href); alert('Link copied');}}}
                aria-label="Share property details"
                style={{
                  background:'rgba(255,255,255,0.9)',
                  border:'1px solid rgba(0,0,0,0.1)',
                  backdropFilter:'blur(4px)',
                  width:44, height:44, borderRadius:12,
                  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                  boxShadow:'0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="M8.59 13.51l6.83 3.98" />
                  <path d="M15.41 6.51L8.59 10.49" />
                </svg>
              </button>
            </div>
            
            <div className={styles.propertyDetailHeader} style={{ height: '420px' }}>
              <PropertyImageGrid
                property={selectedProperty}
                onOpenCarousel={(startIndex) => {
                  setCurrentImageIndex(startIndex);
                  setShowCarousel(true);
                }}
              />
            </div>
            <div className={styles.propertyDetailContent} style={{ padding: '0' }}>
              <div className={styles.propertyDetailBody} style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Property Basic Info - Zillow style */}
                <div className={`${styles.propertyDetailInfo} ${styles.propertyHeadBlock}`}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span style={{ 
                        backgroundColor: getOperationStatusBadge().backgroundColor, 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: '600',
                        display: 'inline-block',
                        marginBottom: '8px'
                      }}>{getOperationStatusBadge().text}</span>
                      <h1 style={{ 
                        fontSize: '28px', 
                        fontWeight: '600', 
                        color: '#2a2a33', 
                        margin: '0 0 8px 0',
                        lineHeight: '1.2'
                      }}>${formatNumberWithCommas(selectedProperty.price)}</h1>
                    </div>
                  </div>
                  <h2 style={{ 
                    fontSize: '16px',
                    fontWeight: '400', 
                    color: '#2a2a33', 
                    margin: '0 0 4px 0' 
                  }}>{selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip_code}</h2>
                  
                  {/* Property Stats */}
                  <div className={styles.propertyStatsRow}>
                    <div className={styles.propertyStat}><strong>{selectedProperty.rooms}</strong><span>beds</span></div>
                    <div className={styles.propertyStat}><strong>{selectedProperty.bathrooms}</strong><span>baths</span></div>
                    <div className={styles.propertyStat}><strong>{selectedProperty.squareMeters}</strong><span>m²</span></div>
                    <div className={styles.propertyStat}><strong>{selectedProperty.type || 'House'}</strong></div>
                    {selectedProperty.yearBuilt && (
                      <div className={styles.propertyStat}><strong>{selectedProperty.yearBuilt}</strong><span>built</span></div>
                    )}
                  </div>
                </div>
                
                {/* Tabs Navigation */}
                <PropertyDetailTabsNav active={activeTab} onChange={handleTabChange} />
                
                {/* All content sections displayed one after another */}
                <div style={{ backgroundColor: 'white' }}>
                  {/* Overview section */}
                  <div ref={overviewRef} id="overview-section" className={styles.overviewSection}>
                    <div className={styles.overviewGrid}>
                      <div className={styles.overviewMain}>
                        <div className={styles.descBlock}>
                          <h3 className={styles.sectionHeading}>Overview</h3>
                          <p className={`${styles.descText} ${!descExpanded ? styles.descClamp : ''}`}>{selectedProperty.description || `This beautiful ${selectedProperty.type || 'property'} features ${selectedProperty.rooms} bedrooms and ${selectedProperty.bathrooms} bathrooms across ${selectedProperty.squareMeters} square meters of living space. Located in a desirable neighborhood in ${selectedProperty.city}, ${selectedProperty.state}, this home offers easy access to local amenities, schools, and transportation.`}</p>
                          {(!descExpanded && (selectedProperty.description?.length || 0) > 320) && (
                            <button className={styles.readMoreBtn} onClick={() => setDescExpanded(true)}>Read more</button>
                          )}
                          {descExpanded && (
                            <button className={styles.readMoreBtn} onClick={() => setDescExpanded(false)}>Show less</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Facts and features section */}
                  <div ref={detailsRef} id="details-section" style={{ padding: '24px', marginBottom: '40px' }}>
                    <div style={{ marginBottom: '32px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '16px'
                      }}>
                        <h3 style={{ 
                          fontSize: '20px', 
                          fontWeight: '600', 
                          margin: '0',
                          color: '#2a2a33'
                        }}>Facts and features</h3>
                        
                        {/* Favorite/save controls removed */}
                      </div>
                      
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
                              <span>Square meters</span>
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
                  
                  {/* Location Section */}
                  <div ref={mapLocationRef} id="location-section" style={{ 
                    marginBottom: '40px',
                    padding: '24px',
                    borderTop: '1px solid #e9e9e9'
                  }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                      <h2 style={{ 
                        fontSize: '28px', 
                        fontWeight: '700', 
                        marginBottom: '32px',
                        color: '#2a2a33',
                        textAlign: 'center'
                      }}>Location</h2>
                      
                      {/* Map Subsection */}
                      <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ 
                          fontSize: '20px', 
                          fontWeight: '600', 
                          marginBottom: '16px',
                          color: '#2a2a33'
                        }}>Map</h3>
                        <div style={{ 
                          width: '100%', 
                          height: '400px', 
                          borderRadius: '8px',
                          overflow: 'hidden',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          position: 'relative'
                        }}>
                          <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
                        </div>
                      </div>
                      
                      {/* Neighborhood Subsection */}
                      <div>
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
                              <div style={{ fontSize: '14px' }}>
                                {neighborhoodData?.subway_access || '10 minute walk to nearest subway station'}
                              </div>
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
                              <div style={{ fontSize: '14px' }}>
                                {neighborhoodData?.highway_access || '5 minute drive to nearest highway'}
                              </div>
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
                              <div style={{ fontSize: '14px' }}>
                                {neighborhoodData?.dining_options || 'Variety of dining options within walking distance'}
                              </div>
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
                              <div style={{ fontSize: '14px' }}>
                                {neighborhoodData?.shopping_access || 'Shopping centers and grocery stores nearby'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* Contact Agent Section - Moved to the end */}
                  <div style={{ 
                    padding: '24px', 
                    backgroundColor: '#f8f9fa',
                    borderTop: '1px solid #e9e9e9'
                  }}>
                    <div style={{ 
                      maxWidth: '600px', 
                      margin: '0 auto', 
                      textAlign: 'center' 
                    }}>
                      {!showContactForm ? (
                        // Initial state - just show the contact button
                        <div style={{ 
                          opacity: showContactForm ? 0 : 1,
                          transition: 'opacity 0.3s ease'
                        }}>
                          <h3 style={{ 
                            fontSize: '24px', 
                            fontWeight: '600', 
                            marginBottom: '16px',
                            color: '#2a2a33'
                          }}>Contact an agent about this home</h3>
                          <p style={{ 
                            fontSize: '16px', 
                            color: '#666', 
                            marginBottom: '24px',
                            lineHeight: '1.5'
                          }}>
                            Get more information about this property, schedule a viewing, or ask any questions you may have.
                          </p>
                          <button 
                            onClick={() => setShowContactForm(true)}
                            style={{
                              padding: '16px 32px',
                              backgroundColor: '#1277e1',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '18px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 4px 12px rgba(18, 119, 225, 0.3)'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#0f6bc7';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(18, 119, 225, 0.4)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#1277e1';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(18, 119, 225, 0.3)';
                            }}
                          >
                            Contact Agent
                          </button>
                        </div>
                      ) : (
                        // Contact form state
                        <div style={{ 
                          opacity: showContactForm ? 1 : 0,
                          transition: 'opacity 0.3s ease',
                          backgroundColor: 'white',
                          padding: '32px',
                          borderRadius: '12px',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                          textAlign: 'left'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '24px'
                          }}>
                            <h3 style={{ 
                              fontSize: '20px', 
                              fontWeight: '600', 
                              margin: '0',
                              color: '#2a2a33'
                            }}>Contact an agent</h3>
                            <button
                              onClick={handleCloseContactForm}
                              style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer',
                                color: '#666',
                                padding: '0',
                                lineHeight: '1',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background-color 0.2s ease'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              aria-label="Close contact form"
                            >
                              ×
                            </button>
                          </div>
                          
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '16px',
                            marginBottom: '16px'
                          }}>
                            <div>
                              <input 
                                type="text" 
                                placeholder="Your Name" 
                                value={contactFormData.name}
                                onChange={(e) => handleContactFormChange('name', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  border: '2px solid #e9e9e9',
                                  borderRadius: '8px',
                                  fontSize: '16px',
                                  transition: 'border-color 0.2s ease',
                                  boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#1277e1'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#e9e9e9'}
                              />
                            </div>
                            <div>
                              <input 
                                type="text" 
                                placeholder="Phone" 
                                value={contactFormData.phone}
                                onChange={(e) => handleContactFormChange('phone', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  border: '2px solid #e9e9e9',
                                  borderRadius: '8px',
                                  fontSize: '16px',
                                  transition: 'border-color 0.2s ease',
                                  boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#1277e1'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#e9e9e9'}
                              />
                            </div>
                          </div>
                          
                          <div style={{ marginBottom: '24px' }}>
                            <input 
                              type="email" 
                              placeholder="Email" 
                              value={contactFormData.email}
                              onChange={(e) => handleContactFormChange('email', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e9e9e9',
                                borderRadius: '8px',
                                fontSize: '16px',
                                transition: 'border-color 0.2s ease',
                                boxSizing: 'border-box',
                                marginBottom: '16px'
                              }}
                              onFocus={(e) => e.currentTarget.style.borderColor = '#1277e1'}
                              onBlur={(e) => e.currentTarget.style.borderColor = '#e9e9e9'}
                            />
                            <textarea 
                              rows={4} 
                              placeholder="I'm interested in this property" 
                              value={contactFormData.message}
                              onChange={(e) => handleContactFormChange('message', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e9e9e9',
                                borderRadius: '8px',
                                fontSize: '16px',
                                transition: 'border-color 0.2s ease',
                                boxSizing: 'border-box',
                                resize: 'vertical',
                                minHeight: '100px'
                              }}
                              onFocus={(e) => e.currentTarget.style.borderColor = '#1277e1'}
                              onBlur={(e) => e.currentTarget.style.borderColor = '#e9e9e9'}
                            />
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            gap: '12px',
                            justifyContent: 'flex-end'
                          }}>
                            <button 
                              onClick={handleCloseContactForm}
                              style={{
                                padding: '12px 24px',
                                backgroundColor: '#f5f5f5',
                                color: '#666',
                                border: '2px solid #e9e9e9',
                                borderRadius: '8px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#e9e9e9';
                                e.currentTarget.style.borderColor = '#ddd';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                                e.currentTarget.style.borderColor = '#e9e9e9';
                              }}
                            >
                              Cancel
                            </button>
                            <button 
                              style={{
                                padding: '12px 24px',
                                backgroundColor: '#1277e1',
                                color: 'white',
                                border: '2px solid #1277e1',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#0f6bc7';
                                e.currentTarget.style.borderColor = '#0f6bc7';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#1277e1';
                                e.currentTarget.style.borderColor = '#1277e1';
                              }}
                            >
                              Send Message
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PropertyImageCarousel
          property={selectedProperty}
          isOpen={showCarousel}
          currentIndex={currentImageIndex}
          onRequestClose={() => setShowCarousel(false)}
          onNavigate={handleImageChange}
          onSelectIndex={(i) => setCurrentImageIndex(i)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          imageLoading={imageLoading}
          setImageLoading={setImageLoading}
        />
    </>
  );
}
