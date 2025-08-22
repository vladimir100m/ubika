import galleryStyles from '../styles/StyledGallery.module.css';
import styles from '../styles/Home.module.css';
import React, {useState, useEffect, useRef, RefObject} from 'react';
import {useRouter} from 'next/router';
import { useSession } from 'next-auth/react';
import { Loader } from '@googlemaps/js-api-loader';
import { Property } from '../types';
import { toggleSaveProperty } from '../utils/savedPropertiesApi';

interface PropertyFeature {
  id: number;
  name: string;
  category: string;
  icon: string;
}

interface Neighborhood {
  id: number;
  name: string;
  description: string;
  subway_access: string;
  dining_options: string;
  shopping_access: string;
  highway_access: string;
}

// Infer a simple emoji/icon fallback when API feature lacks explicit icon
function inferIconFromCategory(category?: string) {
  if(!category) return '•';
  const key = category.toLowerCase();
  if (key.includes('kitchen')) return '🍳';
  if (key.includes('outdoor') || key.includes('garden') || key.includes('patio')) return '🌳';
  if (key.includes('security')) return '🔒';
  if (key.includes('parking') || key.includes('garage')) return '🚗';
  if (key.includes('climate') || key.includes('heating') || key.includes('cooling')) return '🌡️';
  if (key.includes('internet') || key.includes('tech')) return '📶';
  return '•';
}

// Function to generate additional property images based on property type
const generatePropertyImages = (property: Property) => {
  const baseImages = [
    '/properties/casa-moderna.jpg',
    '/properties/casa-lago.jpg',
    '/properties/casa-campo.jpg',
    '/properties/villa-lujo.jpg',
    '/properties/cabana-playa.jpg',
    '/properties/casa-playa.jpg',
    '/properties/casa-colonial.jpg'
  ];

  // Type-specific images
  const typeImages: { [key: string]: string[] } = {
    'apartamento': ['/properties/apartamento-moderno.jpg', '/properties/apartamento-ciudad.jpg', '/properties/penthouse-lujo.jpg'],
    'apartment': ['/properties/apartamento-moderno.jpg', '/properties/apartamento-ciudad.jpg', '/properties/penthouse-lujo.jpg'],
    'casa': ['/properties/casa-moderna.jpg', '/properties/casa-campo.jpg', '/properties/casa-colonial.jpg'],
    'house': ['/properties/casa-moderna.jpg', '/properties/casa-campo.jpg', '/properties/casa-colonial.jpg'],
    'duplex': ['/properties/duplex-moderno.jpg', '/properties/departamento-familiar.jpg'],
    'villa': ['/properties/villa-lujo.jpg', '/properties/casa-lago.jpg'],
    'cabana': ['/properties/cabana-bosque.jpg', '/properties/cabana-montana.jpg', '/properties/cabana-playa.jpg'],
    'cabin': ['/properties/cabana-bosque.jpg', '/properties/cabana-montana.jpg', '/properties/cabana-playa.jpg'],
    'loft': ['/properties/loft-urbano.jpg', '/properties/penthouse-lujo.jpg']
  };

  const propertyType = property.type?.toLowerCase() || 'house';
  const relevantImages = typeImages[propertyType] || baseImages;
  
  // Return 3-4 additional images plus the main image
  return relevantImages.slice(0, 3);
};
  

export default function PropertyPopup({ 
  selectedProperty, 
  onClose, 
  mapRef,
  onFavoriteToggle
}: { 
  selectedProperty: Property & { isFavorite?: boolean }; 
  onClose: () => void; 
  mapRef: RefObject<HTMLDivElement | null>;
  onFavoriteToggle?: (propertyId: number, newStatus: boolean) => void;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const isFavorite = selectedProperty.isFavorite || false;
  const [activeTab, setActiveTab] = useState('overview');
  const [descExpanded, setDescExpanded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [propertyFeatures, setPropertyFeatures] = useState<PropertyFeature[]>([]);
  const [neighborhoodData, setNeighborhoodData] = useState<Neighborhood | null>(null);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  
  // References for each section for smooth scrolling
  const overviewRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const mapLocationRef = useRef<HTMLDivElement>(null);

  // Fetch property features and neighborhood data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Generate additional images based on property type
        const generatedImages = generatePropertyImages(selectedProperty);
        setAdditionalImages(generatedImages);

        // Fetch features specifically assigned to this property
        const featuresResponse = await fetch(`/api/properties/features?propertyId=${selectedProperty.id}`);
        if (featuresResponse.ok) {
          const features = await featuresResponse.json();
          setPropertyFeatures(features);
        }

        // Fetch neighborhood data - try to match by city first
        if (selectedProperty.city) {
          const neighborhoodResponse = await fetch(`/api/neighborhoods?search=${encodeURIComponent(selectedProperty.city)}`);
          if (neighborhoodResponse.ok) {
            const neighborhoods = await neighborhoodResponse.json();
            if (neighborhoods.length > 0) {
              setNeighborhoodData(neighborhoods[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching property data:', error);
      } finally {
        setLoadingFeatures(false);
      }
    };

    fetchData();
  }, [selectedProperty.id, selectedProperty.city, selectedProperty.type]);

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
        }
      });
    }, options);

    // Observe all section refs
    if (overviewRef.current) observer.observe(overviewRef.current);
    if (detailsRef.current) observer.observe(detailsRef.current);
    if (mapLocationRef.current) observer.observe(mapLocationRef.current);

    return () => {
      if (overviewRef.current) observer.unobserve(overviewRef.current);
      if (detailsRef.current) observer.unobserve(detailsRef.current);
      if (mapLocationRef.current) observer.unobserve(mapLocationRef.current);
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
      default:
        break;
    }
  };
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Initialize Google Maps when the component loads
  useEffect(() => {
    if (!mapInitialized && mapRef && mapRef.current) {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['places'],
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
  const handleSaveProperty = async () => {
    if (!user) {
      // If user is not authenticated, redirect to login
      window.location.href = '/api/auth/login';
      return;
    }

    if (isSaving) return; // Prevent multiple clicks
    
    setIsSaving(true);
    try {
      const newStatus = !isFavorite;
      await toggleSaveProperty(selectedProperty.id, isFavorite);
      
      // Call parent callback to update UI
      if (onFavoriteToggle) {
        onFavoriteToggle(selectedProperty.id, newStatus);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite status. Please try again.');
    } finally {
      setIsSaving(false);
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
    // Optional: You could open a full-screen gallery modal here
  };
  
  return (
        <div className={styles.propertyDetailOverlay} onClick={onClose}>
          <div className={styles.propertyDetailCard} onClick={(e) => e.stopPropagation()}>
            <div style={{position:'absolute', top:12, right:12, display:'flex', gap:'10px', zIndex:60}}>
              <button 
                onClick={(e)=>{e.stopPropagation(); onClose();}}
                aria-label="Close"
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
              <button 
                onClick={(e)=>{e.stopPropagation(); handleSaveProperty();}} 
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                disabled={isSaving}
                style={{
                  background:isFavorite ? '#e4002b' : 'rgba(255,255,255,0.9)',
                  color:isFavorite ? '#fff' : '#333',
                  border:isFavorite ? '1px solid #c30023' : '1px solid rgba(0,0,0,0.1)',
                  backdropFilter:'blur(4px)',
                  width:44, height:44, borderRadius:12,
                  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                  boxShadow:'0 2px 6px rgba(0,0,0,0.2)',
                  position:'relative'
                }}
              >
                {isSaving ? '⏳' : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={isFavorite? 'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                )}
              </button>
              <button 
                onClick={(e)=>{e.stopPropagation(); if(navigator.share){navigator.share({title:selectedProperty.title || 'Property', text:selectedProperty.description || 'Check this property', url: window.location.href}).catch(()=>{});} else {navigator.clipboard.writeText(window.location.href); alert('Link copied');}}}
                aria-label="Share property"
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
              {/* 5-Photo Grid Layout */}
              <div 
                className={galleryStyles.styledGallery}
                style={{ 
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr',
                  gridTemplateRows: '1fr 1fr',
                  gap: '8px',
                  height: '100%',
                  width: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#f7f7f7'
                }}
              >
                {/* Main large image (takes 2/4 of space) */}
                {selectedProperty && (
                  <div 
                    style={{
                      gridColumn: '1',
                      gridRow: '1 / span 2',
                      position: 'relative',
                      cursor: 'pointer',
                      overflow: 'hidden'
                    }}
                    onClick={() => handleImageClick(0)}
                  >
                    <img 
                      src={selectedProperty.image_url} 
                      alt="Main property image" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                    {/* Image counter overlay */}
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
                      1 of {additionalImages.length + 1}
                    </div>
                  </div>
                )}
                
                {/* Four smaller images (each takes 1/4 of space) */}
                {additionalImages.slice(0, 4).map((image, index) => (
                  <div 
                    key={index}
                    style={{
                      gridColumn: '2',
                      gridRow: index < 2 ? '1' : '2',
                      position: 'relative',
                      cursor: 'pointer',
                      overflow: 'hidden'
                    }}
                    onClick={() => handleImageClick(index + 1)}
                  >
                    <img 
                      src={image} 
                      alt={`Property image ${index + 2}`} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                    {/* Show "+X more" overlay on the last image if there are more photos */}
                    {index === 3 && additionalImages.length > 4 && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}>
                        +{additionalImages.length - 3} more
                      </div>
                    )}
                  </div>
                ))}
                
                {/* "View all photos" button */}
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
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Here you could open a full-screen gallery
                      console.log('View all photos clicked');
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none" />
                      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                      <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {additionalImages.length + 1} Photos
                  </button>
                </div>
              </div>
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
                      }}>${selectedProperty.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</h1>
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
                    <div className={styles.propertyStat}><strong>{selectedProperty.squareMeters}</strong><span>sqft</span></div>
                    <div className={styles.propertyStat}><strong>{selectedProperty.type || 'House'}</strong></div>
                    {selectedProperty.yearBuilt && (
                      <div className={styles.propertyStat}><strong>{selectedProperty.yearBuilt}</strong><span>built</span></div>
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
                  </ul>
                </div>
                
                {/* All content sections displayed one after another */}
                <div style={{ backgroundColor: 'white' }}>
                  {/* Overview section */}
                  <div ref={overviewRef} id="overview-section" className={styles.overviewSection}>
                    <div className={styles.overviewGrid}>
                      <div className={styles.overviewMain}>
                        <div className={styles.descBlock}>
                          <h3 className={styles.sectionHeading}>Overview</h3>
                          <p className={`${styles.descText} ${!descExpanded ? styles.descClamp : ''}`}>{selectedProperty.description || `This beautiful ${selectedProperty.type || 'property'} features ${selectedProperty.rooms} bedrooms and ${selectedProperty.bathrooms} bathrooms across ${selectedProperty.squareMeters} square feet of living space. Located in a desirable neighborhood in ${selectedProperty.city}, ${selectedProperty.state}, this home offers easy access to local amenities, schools, and transportation.`}</p>
                          {(!descExpanded && (selectedProperty.description?.length || 0) > 320) && (
                            <button className={styles.readMoreBtn} onClick={() => setDescExpanded(true)}>Read more</button>
                          )}
                          {descExpanded && (
                            <button className={styles.readMoreBtn} onClick={() => setDescExpanded(false)}>Show less</button>
                          )}
                        </div>
                        <div className={styles.featureBlock}>
                          <h3 className={styles.sectionHeading}>Home Features</h3>
                          {/* Feature content area */}
                          {loadingFeatures && (
                            <div className={styles.featuresSkeletonWrap} aria-live="polite" aria-busy="true">
                              {Array.from({length:8}).map((_,i)=>(
                                <div key={i} className={styles.featureSkeleton} />
                              ))}
                            </div>
                          )}
                          {!loadingFeatures && propertyFeatures.length === 0 && (
                            <div className={styles.featuresEmpty}>
                              <p>No features have been recorded for this home yet.</p>
                              <small>Ask the seller or agent to add amenities to improve visibility.</small>
                            </div>
                          )}
                          {!loadingFeatures && propertyFeatures.length > 0 && (
                            <div className={styles.featuresCategoryList}>
                              {Object.entries(
                                propertyFeatures.reduce<Record<string, PropertyFeature[]>>((acc, f) => {
                                  const cat = (f.category || 'General').trim();
                                  if(!acc[cat]) acc[cat] = [];
                                  acc[cat].push(f);
                                  return acc;
                                }, {})
                              ).map(([category, feats]) => {
                                // Limit features if not expanded
                                const displayFeats = showAllFeatures ? feats : feats.slice(0, 6);
                                return (
                                  <div key={category} className={styles.featureCategoryGroup}>
                                    <div className={styles.featureCategoryHeader}>
                                      <h4 className={styles.featureCategoryTitle}>{category}</h4>
                                      {!showAllFeatures && feats.length > 6 && (
                                        <span className={styles.featureCategoryCount}>{feats.length} total</span>
                                      )}
                                    </div>
                                    <ul className={styles.featureChips}>
                                      {displayFeats.map(f => (
                                        <li key={f.id} className={styles.featureChip}>
                                          <span className={styles.featureIconWrap} aria-hidden="true">{f.icon || inferIconFromCategory(f.category)}</span>
                                          <span className={styles.featureChipLabel}>{f.name}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              })}
                              {/* Show more / less */}
                              {propertyFeatures.length > 12 && (
                                <button
                                  type="button"
                                  className={styles.featureExpandBtn}
                                  onClick={()=>setShowAllFeatures(s=>!s)}
                                  aria-expanded={showAllFeatures}
                                >
                                  {showAllFeatures ? 'Show fewer features' : 'Show all features'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={styles.overviewAside}>
                        <div className={styles.contactSideCard}>
                          <h3 className={styles.sideCardTitle}>Contact an agent about this home</h3>
                          <div className={styles.sideFieldWrap}><input type="text" placeholder="Your Name" className={styles.sideInput} /></div>
                          <div className={styles.sideFieldWrap}><input type="text" placeholder="Phone" className={styles.sideInput} /></div>
                          <div className={styles.sideFieldWrap}><input type="email" placeholder="Email" className={styles.sideInput} /></div>
                          <div className={styles.sideFieldWrap}><textarea rows={4} placeholder="I'm interested in this property" className={styles.sideTextarea} /></div>
                          <button className={styles.sideSubmitBtn}>Contact Agent</button>
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
                            
                            {loadingFeatures ? (
                              <div style={{ color: '#666', fontSize: '14px' }}>Loading features...</div>
                            ) : (
                              propertyFeatures
                                .filter(feature => feature.category === 'climate')
                                .slice(0, 3)
                                .map((feature) => (
                                  <div key={feature.id} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px',
                                    marginBottom: '4px',
                                    fontSize: '14px'
                                  }}>
                                    <span style={{ 
                                      color: '#1277e1', 
                                      fontSize: '16px'
                                    }}>{feature.icon || '•'}</span>
                                    <span>{feature.name}</span>
                                  </div>
                                ))
                            )}
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
              </div>
            </div>
          </div>
        </div>);
}
