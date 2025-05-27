import React, { useState, useEffect } from 'react';
import styles from '../styles/PropertyCard.module.css';
import { Property } from '../types';
import PropertyGallery from './PropertyGallery';

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
  onFavoriteToggle?: () => void; // Add favorite toggle handler
  isFavorite?: boolean; // Add favorite status
};

const PropertyDialog: React.FC<{ property: PropertyCardProps; onClose: () => void }> = ({ property, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (property.onFavoriteToggle) {
      property.onFavoriteToggle();
    }
  };
  
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
            >
              <span>{property.isFavorite ? '❤️' : '♡'}</span> {property.isFavorite ? 'Saved' : 'Save'}
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
            Overview
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
                
                {/* Right column: Map preview and contact */}
                <div className={styles.propertyAsideDetails}>
                  {(property.latitude && property.longitude) && (
                    <div className={styles.mapPreviewContainer}>
                      <h3 className={styles.sectionTitle}>Location</h3>
                      <div className={styles.smallMapContainer}>
                        <iframe
                          src={`https://www.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
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
              {(property.latitude && property.longitude) ? (
                <div className={styles.fullMapContainer}>
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
                
                <div className={styles.neighborhoodGrid}>
                  <div className={styles.neighborhoodItem}>
                    <h4>Schools</h4>
                    <ul>
                      <li>Elementary School (0.5 miles)</li>
                      <li>Middle School (1.2 miles)</li>
                      <li>High School (2.0 miles)</li>
                    </ul>
                  </div>
                  <div className={styles.neighborhoodItem}>
                    <h4>Transportation</h4>
                    <ul>
                      <li>Bus Stop (0.2 miles)</li>
                      <li>Subway Station (0.7 miles)</li>
                      <li>Airport (10.5 miles)</li>
                    </ul>
                  </div>
                  <div className={styles.neighborhoodItem}>
                    <h4>Shopping & Dining</h4>
                    <ul>
                      <li>Grocery Store (0.3 miles)</li>
                      <li>Shopping Mall (1.5 miles)</li>
                      <li>Restaurants (0.4 miles)</li>
                    </ul>
                  </div>
                </div>
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
  const [isHovered, setIsHovered] = useState(false);

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
    if (props.onFavoriteToggle) {
      props.onFavoriteToggle();
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={styles.imageContainer} onClick={handleCardClick}>
          <img src={props.image_url} alt="Property" className={styles.image} />
          <div className={styles.imageOverlay}>
            <span className={styles.statusTag}>For Sale</span>
            <button 
              className={`${styles.saveButton} ${props.isFavorite ? styles.savedButton : ''}`}
              onClick={handleSaveClick}
              aria-label={props.isFavorite ? "Remove from saved" : "Save property"}
            >
              {props.isFavorite ? '❤️' : '🤍'} {props.isFavorite ? 'Saved' : 'Save'}
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
            <button className={styles.viewDetailsButton}>
              {isHovered ? 'View Details' : 'See More'}
            </button>
            <button className={styles.shareButton} onClick={handleShareClick} aria-label="Share property">
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