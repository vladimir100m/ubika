import React, { useState, useEffect } from 'react';
import styles from '../styles/PropertyCard.module.css';
import { Property } from '../types';
import PropertyGallery from './PropertyGallery';
import { useUser } from '@auth0/nextjs-auth0/client';
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
  city: string;
  description: string;
  subway_access: string;
  dining_options: string;
  schools_info: string;
  shopping_info: string;
  parks_recreation: string;
  safety_rating: number;
  walkability_score: number;
}

export type PropertyCardProps = Pick<
  Property,
  | 'id' // Add property ID
  | 'image_url' // Corrected from imageUrl
  | 'description'
  | 'price'
  | 'rooms'
  | 'bathrooms'
  | 'address'
  | 'squareMeters'
> & {
  // yearBuilt, latitude, and longitude are optional in Property, so they should be optional here too
  yearBuilt?: number;
  latitude?: number;
  longitude?: number;
  geocode?: { lat: number; lng: number };
  onClick?: () => void; // Add onClick prop
  onFavoriteToggle?: (propertyId: number, newStatus: boolean) => void; // Update favorite toggle handler
  isFavorite?: boolean; // Add favorite status
};

const PropertyDialog: React.FC<{ property: PropertyCardProps; onClose: () => void }> = ({ property, onClose }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [propertyFeatures, setPropertyFeatures] = useState<PropertyFeature[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [loadingNeighborhood, setLoadingNeighborhood] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/api/auth/login';
      return;
    }

    if (isSaving) return; // Prevent multiple clicks
    
    setIsSaving(true);
    try {
      const newStatus = !property.isFavorite;
      await toggleSaveProperty(property.id, property.isFavorite || false);
      
      // Call parent callback to update UI
      if (property.onFavoriteToggle) {
        property.onFavoriteToggle(property.id, newStatus);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite status. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Fetch property features and neighborhood data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch property features
        const featuresResponse = await fetch('/api/property-features');
        if (featuresResponse.ok) {
          const features = await featuresResponse.json();
          setPropertyFeatures(features);
        }

        // Fetch neighborhood data by searching for the property's address
        if (property.address) {
          // Extract city from address (assuming format includes city)
          const addressParts = property.address.split(',');
          const searchTerm = addressParts.length > 1 ? addressParts[1].trim() : addressParts[0].trim();
          
          const neighborhoodResponse = await fetch(`/api/neighborhoods?search=${encodeURIComponent(searchTerm)}`);
          if (neighborhoodResponse.ok) {
            const neighborhoods = await neighborhoodResponse.json();
            if (neighborhoods.length > 0) {
              setNeighborhood(neighborhoods[0]); // Use the first matching neighborhood
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingFeatures(false);
        setLoadingNeighborhood(false);
      }
    };

    fetchData();
  }, [property.address]);
  
  // Simulate multiple property images using the same image
  // In a real app, you would have an array of image URLs
  const propertyImages = [
    property.image_url,
    property.image_url,
    property.image_url,
    property.image_url,
    property.image_url,
  ];
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    // Prevent body scrolling when dialog is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  return (
    <div className={styles.dialogOverlay} onClick={onClose} role="dialog" aria-labelledby="dialog-title" aria-describedby="dialog-description">
      <div className={styles.zillowDialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <div className={styles.dialogHeaderContent}>
            <h2 id="dialog-title" className={styles.dialogPrice}>{property.price}</h2>
            <h3 className={styles.dialogAddress}>{property.address}</h3>
            <div className={styles.dialogQuickInfo}>
              <span>{property.rooms} bd</span>
              <span className={styles.bulletSeparator}>
                &bull;
              </span>
              <span>{property.bathrooms} ba</span>
              <span className={styles.bulletSeparator}>
                &bull;
              </span>
              <span>{property.squareMeters} m&sup2;</span>
              {property.yearBuilt && (
                <>
                  <span className={styles.bulletSeparator}>
                    &bull;
                  </span>
                  <span>Built in {property.yearBuilt}</span>
                </>
              )}
            </div>
          </div>
          <div className={styles.dialogActions}>
            <button 
              className={`${styles.actionButton} ${property.isFavorite ? styles.savedActionButton : ''}`} 
              aria-label={property.isFavorite ? "Remove from saved" : "Save property"}
              onClick={handleFavoriteToggle}
              disabled={isSaving}
            >
              <span className={styles.heartIcon}>{isSaving ? '⏳' : (property.isFavorite ? '❤️' : '♡')}</span> {isSaving ? 'Saving...' : (property.isFavorite ? 'Saved' : 'Save')}
            </button>
            <button className={styles.actionButton} aria-label="Share Property">
              <span>&#128279;</span> Share
            </button>
            <button onClick={onClose} className={styles.closeDialogButton} aria-label="Close Dialog">
              &times;
            </button>
          </div>
        </div>
        <div className={styles.dialogTabs}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('overview')}
            aria-label="Overview Tab"
          >
            {isMobile ? 'Info' : 'Overview'}
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'photos' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('photos')}
            aria-label="Photos Tab"
          >
            Photos
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'map' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('map')}
            aria-label="Map Tab"
          >
            Map
          </button>
        </div>
        <div className={styles.dialogContent}>
          {activeTab === 'overview' && (
            <>
              <PropertyGallery images={propertyImages} initialIndex={selectedImageIndex} />
              <div className={styles.overviewContentGrid}>
                <div className={styles.propertyMainDetails}>
                  <h3 className={styles.sectionTitle}>About This Home</h3>
                  <p id="dialog-description" className={styles.propertyDescription}>{property.description}</p>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Property Type</span>
                      <span className={styles.detailValue}>Residential</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Year Built</span>
                      <span className={styles.detailValue}>{property.yearBuilt || 'N/A'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Bedrooms</span>
                      <span className={styles.detailValue}>{property.rooms}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Bathrooms</span>
                      <span className={styles.detailValue}>{property.bathrooms}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Living Area</span>
                      <span className={styles.detailValue}>{property.squareMeters} m²</span>
                    </div>
                  </div>
                  
                  <div className={styles.featuresSection}>
                    <h3 className={styles.sectionTitle}>Home Features</h3>
                    <div className={styles.featuresList}>
                      {loadingFeatures ? (
                        <div style={{ color: '#666', fontSize: '14px' }}>Loading features...</div>
                      ) : (
                        <>
                          <div className={styles.featureCategory}>
                            <h4>Interior Features</h4>
                            <ul>
                              {propertyFeatures
                                .filter(feature => ['climate', 'indoor'].includes(feature.category))
                                .slice(0, 4)
                                .map(feature => (
                                  <li key={feature.id}>{feature.name}</li>
                                ))
                              }
                            </ul>
                          </div>
                          <div className={styles.featureCategory}>
                            <h4>Exterior Features</h4>
                            <ul>
                              {propertyFeatures
                                .filter(feature => ['outdoor', 'recreation'].includes(feature.category))
                                .slice(0, 3)
                                .map(feature => (
                                  <li key={feature.id}>{feature.name}</li>
                                ))
                              }
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right column: Map preview and contact */}
                <div className={styles.propertyAsideDetails}>
                  {((property.latitude && property.longitude) || property.geocode) && (
                    <div className={styles.mapPreviewContainer}>
                      <h3 className={styles.sectionTitle}>Location</h3>
                      <div className={styles.smallMapContainer}>
                        <iframe
                          src={`https://www.google.com/maps?q=${property.geocode?.lat || property.latitude},${property.geocode?.lng || property.longitude}&z=15&output=embed`}
                          width="100%"
                          height="200"
                          style={{ border: 0, borderRadius: '8px' }}
                          allowFullScreen={false}
                          loading="lazy"
                          title="Property Location"
                        ></iframe>
                      </div>
                      <button 
                        className={styles.viewMoreButton}
                        onClick={() => setActiveTab('map')}
                      >
                        View Full Map
                      </button>
                    </div>
                  )}
                  
                  <div className={styles.contactSection}>
                    <h3 className={styles.sectionTitle}>Contact an Agent</h3>
                    <button className={styles.contactButton}>Request a Tour</button>
                    <button className={styles.contactButton}>Ask a Question</button>
                  </div>
                  
                  <div className={styles.priceHistoryContainer}>
                    <h3 className={styles.sectionTitle}>Price History</h3>
                    <div className={styles.priceHistoryItem}>
                      <div className={styles.priceHistoryDate}>May 2025</div>
                      <div className={styles.priceHistoryPrice}>Listed for {property.price}</div>
                    </div>
                    <div className={styles.priceHistoryItem}>
                      <div className={styles.priceHistoryDate}>March 2023</div>
                      <div className={styles.priceHistoryPrice}>Sold for ${parseInt(property.price.replace(/[^\d]/g, '')) * 0.9}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'photos' && (
            <div className={styles.photosTabContent}>
              <PropertyGallery images={propertyImages} initialIndex={selectedImageIndex} />
            </div>
          )}
          
          {activeTab === 'map' && (
            <div className={styles.mapTabContent}>
              {(property.geocode || (property.latitude && property.longitude)) ? (
                <div className={styles.fullMapContainer}>
                  <iframe
                    src={`https://www.google.com/maps?q=${property.geocode?.lat || property.latitude},${property.geocode?.lng || property.longitude}&z=15&output=embed`}
                    width="100%"
                    height="500"
                    style={{ border: 0, borderRadius: '8px' }}
                    allowFullScreen={false}
                    loading="lazy"
                    title="Property Location"
                  ></iframe>
                  <div className={styles.mapOverlay}>
                    <div className={styles.locationPin}>📍</div>
                    <div className={styles.locationInfo}>
                      <p>{property.address}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.noMapData}>
                  <p>Map location data not available for this property</p>
                </div>
              )}
              <div className={styles.neighborhoodInfo}>
                <h3 className={styles.sectionTitle}>Neighborhood</h3>
                {loadingNeighborhood ? (
                  <div style={{ color: '#666', fontSize: '14px' }}>Loading neighborhood information...</div>
                ) : neighborhood ? (
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '18px', color: '#2a2a33', marginBottom: '8px' }}>
                        {neighborhood.name}, {neighborhood.city}
                      </h4>
                      <p style={{ color: '#5a6a7a', lineHeight: '1.5' }}>
                        {neighborhood.description}
                      </p>
                    </div>
                    
                    <div className={styles.neighborhoodGrid}>
                      {neighborhood.schools_info && (
                        <div className={styles.neighborhoodItem}>
                          <h4>Schools</h4>
                          <p style={{ color: '#5a6a7a', fontSize: '14px' }}>
                            {neighborhood.schools_info}
                          </p>
                        </div>
                      )}
                      
                      {neighborhood.subway_access && (
                        <div className={styles.neighborhoodItem}>
                          <h4>Transportation</h4>
                          <p style={{ color: '#5a6a7a', fontSize: '14px' }}>
                            {neighborhood.subway_access}
                          </p>
                        </div>
                      )}
                      
                      {neighborhood.dining_options && (
                        <div className={styles.neighborhoodItem}>
                          <h4>Shopping & Dining</h4>
                          <p style={{ color: '#5a6a7a', fontSize: '14px' }}>
                            {neighborhood.dining_options}
                          </p>
                        </div>
                      )}
                      
                      {neighborhood.shopping_info && (
                        <div className={styles.neighborhoodItem}>
                          <h4>Shopping</h4>
                          <p style={{ color: '#5a6a7a', fontSize: '14px' }}>
                            {neighborhood.shopping_info}
                          </p>
                        </div>
                      )}
                      
                      {neighborhood.parks_recreation && (
                        <div className={styles.neighborhoodItem}>
                          <h4>Parks & Recreation</h4>
                          <p style={{ color: '#5a6a7a', fontSize: '14px' }}>
                            {neighborhood.parks_recreation}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {(neighborhood.safety_rating || neighborhood.walkability_score) && (
                      <div style={{ 
                        marginTop: '20px', 
                        padding: '16px', 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: '8px',
                        display: 'flex',
                        gap: '20px'
                      }}>
                        {neighborhood.safety_rating && (
                          <div>
                            <div style={{ fontSize: '14px', color: '#5a6a7a', marginBottom: '4px' }}>
                              Safety Rating
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2a2a33' }}>
                              {neighborhood.safety_rating}/5 ⭐
                            </div>
                          </div>
                        )}
                        
                        {neighborhood.walkability_score && (
                          <div>
                            <div style={{ fontSize: '14px', color: '#5a6a7a', marginBottom: '4px' }}>
                              Walkability Score
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2a2a33' }}>
                              {neighborhood.walkability_score}/100 🚶
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
                    Neighborhood information not available for this location
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.dialogFooter}>
          <button onClick={onClose} className={styles.closeButton}>Close</button>
        </div>
      </div>
    </div>
  );
};

// Updated PropertyCard component to enhance design and functionality
const PropertyCard: React.FC<PropertyCardProps> = (props) => {
  const { user } = useUser();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleCardClick = () => {
    if (props.onClick) {
      props.onClick();
    } else {
      setDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card click
    
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/api/auth/login';
      return;
    }

    if (isSaving) return; // Prevent multiple clicks
    
    setIsSaving(true);
    try {
      const newStatus = !props.isFavorite;
      await toggleSaveProperty(props.id, props.isFavorite || false);
      
      // Call parent callback to update UI
      if (props.onFavoriteToggle) {
        props.onFavoriteToggle(props.id, newStatus);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite status. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card click
    // Share functionality would go here
    alert('Share this property: ' + props.address);
  };

  return (
    <>
      <div 
        className={styles.card}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        onClick={handleCardClick}
      >
        <div className={styles.imageContainer}>
          <img src={props.image_url} alt="Property" className={styles.image} />
          <div className={styles.imageOverlay}>
            <span className={styles.statusTag}>For Sale</span>
            <button 
              className={`${styles.saveButton} ${props.isFavorite ? styles.savedButton : ''}`}
              onClick={handleSaveClick}
              disabled={isSaving}
              aria-label={props.isFavorite ? "Remove from saved" : "Save property"}
            >
              {isSaving ? '⏳' : (props.isFavorite ? '❤️' : '🤍')} {!isMobile && (isSaving ? 'Saving...' : (props.isFavorite ? 'Saved' : 'Save'))}
            </button>
          </div>
        </div>
        <div className={styles.details}>
          <h3 className={styles.price}>{props.price}</h3>
          <div className={styles.propertySpecs}>
            <span>{props.rooms} bd</span>
            <span className={styles.bulletSeparator}>•</span>
            <span>{props.bathrooms} ba</span>
            <span className={styles.bulletSeparator}>•</span>
            <span>{props.squareMeters} m²</span>
          </div>
          <p className={styles.address}>{props.address}</p>
          <div className={styles.cardFooter}>
            <button className={styles.viewDetailsButton}>
              {isHovered || isMobile ? 'View Details' : 'See More'}
            </button>
            {!isMobile && (
              <button className={styles.shareButton} onClick={handleShareClick} aria-label="Share property">
                <span>🔗</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {isDialogOpen && <PropertyDialog property={props} onClose={handleCloseDialog} />}
    </>
  );
};

export default PropertyCard;
