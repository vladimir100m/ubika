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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  
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

  const handleImageExpand = () => {
    setIsImageExpanded(!isImageExpanded);
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
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
              {/* Image Gallery at the top */}
              <div className={styles.imageGalleryContainer}>
                <div className={styles.mainImageContainer} onClick={handleImageExpand}>
                  <img 
                    src={propertyImages[selectedImageIndex]} 
                    alt={`Property view ${selectedImageIndex + 1}`} 
                    className={`${styles.mainGalleryImage} ${isImageExpanded ? styles.expandedImage : ''}`}
                  />
                  {isImageExpanded && (
                    <button className={styles.minimizeButton} onClick={handleImageExpand}>
                      Minimize
                    </button>
                  )}
                </div>
                <div className={styles.thumbnailsContainer}>
                  {propertyImages.map((img, index) => (
                    <div 
                      key={index}
                      className={`${styles.thumbnailWrapper} ${selectedImageIndex === index ? styles.activeThumbnail : ''}`}
                      onClick={() => handleThumbnailClick(index)}
                    >
                      <img 
                        src={img} 
                        alt={`Property thumbnail ${index + 1}`} 
                        className={styles.thumbnailImage}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={styles.overviewContentGrid}>
                {/* Left column: Property details */}
                <div className={styles.propertyMainDetails}>
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
            <div className={styles.fullPhotoGallery}>
              {propertyImages.map((img, index) => (
                <div key={index} className={styles.galleryImageWrapper}>
                  <img 
                    src={img} 
                    alt={`Property view ${index + 1}`} 
                    className={styles.fullGalleryImage}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setIsImageExpanded(true);
                    }}
                  />
                  <div className={styles.photoInfo}>Photo {index + 1}</div>
                </div>
              ))}
              
              {isImageExpanded && (
                <div className={styles.lightbox} onClick={() => setIsImageExpanded(false)}>
                  <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                    <img 
                      src={propertyImages[selectedImageIndex]} 
                      alt={`Property view ${selectedImageIndex + 1}`} 
                      className={styles.lightboxImage}
                    />
                    <button 
                      className={styles.lightboxClose} 
                      onClick={() => setIsImageExpanded(false)}
                    >
                      ✕
                    </button>
                    <div className={styles.lightboxNav}>
                      <button 
                        className={styles.lightboxNavButton}
                        onClick={() => setSelectedImageIndex(
                          (selectedImageIndex - 1 + propertyImages.length) % propertyImages.length
                        )}
                      >
                        ◀
                      </button>
                      <span>{selectedImageIndex + 1} / {propertyImages.length}</span>
                      <button 
                        className={styles.lightboxNavButton}
                        onClick={() => setSelectedImageIndex(
                          (selectedImageIndex + 1) % propertyImages.length
                        )}
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                </div>
              )}
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