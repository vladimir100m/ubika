import React, { useState } from 'react';
import { Property } from '../types';
import styles from '../styles/Mobile.module.css';

type MobilePropertyDetailProps = {
  property: Property;
  onClose: () => void;
  onFavoriteToggle?: (id: number) => void;
  isFavorite?: boolean;
};

const MobilePropertyDetail: React.FC<MobilePropertyDetailProps> = ({
  property,
  onClose,
  onFavoriteToggle,
  isFavorite = false,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'map' | 'contact'>('info');
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);

  // Sample additional images for the gallery
  const additionalImages = [
    '/properties/casa-moderna.jpg',
    '/properties/casa-lago.jpg',
    '/properties/casa-campo.jpg',
    '/properties/villa-lujo.jpg',
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const allImages = [property.image_url, ...additionalImages];

  const handleFavoriteToggle = () => {
    if (onFavoriteToggle) {
      onFavoriteToggle(property.id);
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % allImages.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + allImages.length) % allImages.length);
  };

  const toggleImageFullscreen = () => {
    setIsImageFullscreen(!isImageFullscreen);
  };

  return (
    <div className={styles.mobilePropertyDetail}>
      <div className={styles.detailHeader}>
        <button 
          className={styles.backButton} 
          onClick={onClose}
          aria-label="Go back"
        >
          ←
        </button>
        <button 
          className={`${styles.favoriteDetailButton} ${isFavorite ? styles.isFavorite : ''}`}
          onClick={handleFavoriteToggle}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>

      <div 
        className={`${styles.propertyImageGallery} ${isImageFullscreen ? styles.fullscreen : ''}`}
        onClick={toggleImageFullscreen}
      >
        <img 
          src={allImages[currentImageIndex]} 
          alt={`Property ${currentImageIndex + 1}`} 
          className={styles.detailImage}
        />
        
        <div className={styles.galleryControls}>
          <button 
            className={styles.galleryButton} 
            onClick={handlePrevImage}
            disabled={allImages.length <= 1}
            aria-label="Previous image"
          >
            ◀
          </button>
          <span className={styles.imageCounter}>
            {currentImageIndex + 1} / {allImages.length}
          </span>
          <button 
            className={styles.galleryButton} 
            onClick={handleNextImage}
            disabled={allImages.length <= 1}
            aria-label="Next image"
          >
            ▶
          </button>
        </div>
      </div>

      <div className={styles.detailPrice}>
        <h1>{property.price}</h1>
        <p className={styles.detailAddress}>{property.address}</p>
      </div>

      <div className={styles.detailTabs}>
        <button 
          className={`${styles.detailTab} ${activeTab === 'info' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Information
        </button>
        <button 
          className={`${styles.detailTab} ${activeTab === 'map' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('map')}
        >
          Map
        </button>
        <button 
          className={`${styles.detailTab} ${activeTab === 'contact' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          Contact
        </button>
      </div>

      <div className={styles.detailContent}>
        {activeTab === 'info' && (
          <div className={styles.infoTab}>
            <div className={styles.detailFeatures}>
              <div className={styles.detailFeature}>
                <span className={styles.featureIcon}>🛏️</span>
                <span className={styles.featureValue}>{property.rooms}</span>
                <span className={styles.featureLabel}>Bedrooms</span>
              </div>
              <div className={styles.detailFeature}>
                <span className={styles.featureIcon}>🛁</span>
                <span className={styles.featureValue}>{property.bathrooms}</span>
                <span className={styles.featureLabel}>Bathrooms</span>
              </div>
              <div className={styles.detailFeature}>
                <span className={styles.featureIcon}>📐</span>
                <span className={styles.featureValue}>{property.squareMeters}</span>
                <span className={styles.featureLabel}>m²</span>
              </div>
              {property.yearBuilt && (
                <div className={styles.detailFeature}>
                  <span className={styles.featureIcon}>🏗️</span>
                  <span className={styles.featureValue}>{property.yearBuilt}</span>
                  <span className={styles.featureLabel}>Year Built</span>
                </div>
              )}
            </div>
            
            <div className={styles.detailSection}>
              <h2>Description</h2>
              <p className={styles.detailDescription}>{property.description}</p>
            </div>
            
            <div className={styles.detailSection}>
              <h2>Property Details</h2>
              <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Type:</span>
                  <span className={styles.detailValue}>{property.type}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Status:</span>
                  <span className={styles.detailValue}>{property.status}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>City:</span>
                  <span className={styles.detailValue}>{property.city}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>State:</span>
                  <span className={styles.detailValue}>{property.state}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Country:</span>
                  <span className={styles.detailValue}>{property.country}</span>
                </div>
                {property.zip_code && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>ZIP Code:</span>
                    <span className={styles.detailValue}>{property.zip_code}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className={styles.mapTab}>
            {(property.latitude && property.longitude) ? (
              <iframe
                src={`https://www.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                title="Property Location"
              ></iframe>
            ) : (
              <div className={styles.noMapData}>
                <p>Map data not available for this property.</p>
              </div>
            )}
            
            <div className={styles.locationDetails}>
              <h2>Location</h2>
              <p className={styles.detailAddress}>{property.address}</p>
              <p>{property.city}, {property.state}, {property.country}</p>
              {property.zip_code && <p>ZIP Code: {property.zip_code}</p>}
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className={styles.contactTab}>
            <h2>Contact Agent</h2>
            <div className={styles.agentInfo}>
              <div className={styles.agentAvatar}>
                <img src="/properties/agent-avatar.jpg" alt="Agent" onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://via.placeholder.com/50';
                }} />
              </div>
              <div className={styles.agentDetails}>
                <h3>John Doe</h3>
                <p>Real Estate Agent</p>
                <p>License #12345</p>
              </div>
            </div>
            
            <div className={styles.contactForm}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Name</label>
                <input type="text" id="name" placeholder="Your name" />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input type="email" id="email" placeholder="Your email" />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="phone">Phone</label>
                <input type="tel" id="phone" placeholder="Your phone number" />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="message">Message</label>
                <textarea id="message" rows={4} placeholder="I'm interested in this property..."></textarea>
              </div>
              <button className={styles.contactSubmitButton}>Send Message</button>
            </div>
            
            <div className={styles.contactOptions}>
              <a href={`tel:+123456789`} className={styles.contactOption}>
                <span className={styles.contactIcon}>📞</span>
                <span>Call Agent</span>
              </a>
              <a href={`sms:+123456789`} className={styles.contactOption}>
                <span className={styles.contactIcon}>✉️</span>
                <span>Text Agent</span>
              </a>
            </div>
          </div>
        )}
      </div>

      <div className={styles.detailActions}>
        <button className={styles.shareButton}>
          <span className={styles.actionIcon}>🔗</span>
          Share
        </button>
        <button className={styles.scheduleButton}>
          <span className={styles.actionIcon}>📅</span>
          Schedule Tour
        </button>
      </div>
    </div>
  );
};

export default MobilePropertyDetail;
