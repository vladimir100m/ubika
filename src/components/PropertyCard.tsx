import React, { useState, useEffect } from 'react';
import styles from '../styles/PropertyCard.module.css';
import { Property } from '../types';

export type PropertyCardProps = Pick<
  Property,
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
  onClick?: () => void; // Add onClick prop
};

const PropertyDialog: React.FC<{ property: PropertyCardProps; onClose: () => void }> = ({ property, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  
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

  const handleImageClick = () => {
    setIsImageExpanded(!isImageExpanded);
  };

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.zillowDialog} onClick={(e) => e.stopPropagation()}>
        {/* Header with price and address */}
        <div className={styles.dialogHeader}>
          <div className={styles.dialogHeaderContent}>
            <h2 className={styles.dialogPrice}>{property.price}</h2>
            <h3 className={styles.dialogAddress}>{property.address}</h3>
            <div className={styles.dialogQuickInfo}>
              <span>{property.rooms} bd</span>
              <span className={styles.bulletSeparator}>•</span>
              <span>{property.bathrooms} ba</span>
              <span className={styles.bulletSeparator}>•</span>
              <span>{property.squareMeters} m²</span>
              {property.yearBuilt && (
                <>
                  <span className={styles.bulletSeparator}>•</span>
                  <span>Built in {property.yearBuilt}</span>
                </>
              )}
            </div>
          </div>
          <div className={styles.dialogActions}>
            <button className={styles.actionButton}><span>❤️</span> Save</button>
            <button className={styles.actionButton}><span>🔗</span> Share</button>
            <button onClick={onClose} className={styles.closeDialogButton}>✕</button>
          </div>
        </div>
        
        {/* Navigation tabs */}
        <div className={styles.dialogTabs}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'photos' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            Photos
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'map' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('map')}
          >
            Map
          </button>
        </div>
        
        {/* Main content area */}
        <div className={styles.dialogContent}>
          {activeTab === 'overview' && (
            <>
              <div className={styles.dialogImageGallery}>
                <img 
                  src={property.image_url} 
                  alt="Property" 
                  className={`${styles.dialogMainImage} ${isImageExpanded ? styles.expandedImage : ''}`} 
                  onClick={handleImageClick}
                />
                <div className={styles.imageCaption}>Click image to {isImageExpanded ? 'minimize' : 'expand'}</div>
              </div>
              
              <div className={styles.propertyDetails}>
                <h3 className={styles.sectionTitle}>About This Home</h3>
                <p className={styles.propertyDescription}>{property.description}</p>
                
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
                    <div className={styles.featureCategory}>
                      <h4>Interior Features</h4>
                      <ul>
                        <li>Central Air</li>
                        <li>Heating System</li>
                        <li>Hardwood Floors</li>
                        <li>Modern Kitchen</li>
                      </ul>
                    </div>
                    <div className={styles.featureCategory}>
                      <h4>Exterior Features</h4>
                      <ul>
                        <li>Balcony</li>
                        <li>Security System</li>
                        <li>Parking</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.contactSection}>
                <h3 className={styles.sectionTitle}>Contact an Agent</h3>
                <button className={styles.contactButton}>Request a Tour</button>
                <button className={styles.contactButton}>Ask a Question</button>
              </div>
            </>
          )}
          
          {activeTab === 'photos' && (
            <div className={styles.photosGrid}>
              <img src={property.image_url} alt="Property" className={styles.gridImage} />
              {/* We would normally have multiple images here */}
              <div className={styles.placeholderImage}>
                <span>Additional photos would be displayed here</span>
              </div>
              <div className={styles.placeholderImage}>
                <span>Additional photos would be displayed here</span>
              </div>
              <div className={styles.placeholderImage}>
                <span>Additional photos would be displayed here</span>
              </div>
            </div>
          )}
          
          {activeTab === 'map' && (
            <div className={styles.mapTabContent}>
              {(property.latitude && property.longitude) ? (
                <div className={styles.mapContainer}>
                  <iframe
                    src={`https://www.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
                    width="100%"
                    height="500"
                    style={{ border: 0 }}
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
                <p>Information about the surrounding area would be displayed here</p>
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
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card click
    setIsSaved(!isSaved);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card click
    // Share functionality would go here
    alert('Share this property: ' + props.address);
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.imageContainer} onClick={handleCardClick}>
          <img src={props.image_url} alt="Property" className={styles.image} />
          <div className={styles.imageOverlay}>
            <span className={styles.statusTag}>For Sale</span>
            <button 
              className={`${styles.saveButton} ${isSaved ? styles.savedButton : ''}`}
              onClick={handleSaveClick}
            >
              {isSaved ? '❤️' : '🤍'} {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
        <div className={styles.details} onClick={handleCardClick}>
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
            <button className={styles.viewDetailsButton}>View Details</button>
            <button className={styles.shareButton} onClick={handleShareClick}>
              <span>🔗</span>
            </button>
          </div>
        </div>
      </div>
      {isDialogOpen && <PropertyDialog property={props} onClose={handleCloseDialog} />}
    </>
  );
};

export default PropertyCard;