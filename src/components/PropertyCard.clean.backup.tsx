import React, { useState } from 'react';
import styles from '../styles/PropertyCard.module.css';
import { toggleSaveProperty } from '../utils/savedPropertiesApi';

interface PropertyCardProps {
  property: {
    id: number;
    title?: string;
    price?: string | number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    rooms?: number;
    bathrooms?: number;
    squareMeters?: number;
    image_url?: string;
    description?: string;
    type?: string;
    yearBuilt?: number;
    operation_status_display?: string;
  };
  onFavoriteToggle?: (id: number, isFavorite: boolean) => void;
  isFavorite?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onFavoriteToggle, isFavorite }) => {
  const [isLoading, setIsLoading] = useState(false);
  const defaultImage = '/properties/casa-moderna.jpg';
  
  const images = [property.image_url].filter(Boolean) as string[];
  const formattedAddress = property.address ? (property.city && property.state ? `${property.address}, ${property.city}, ${property.state}` : property.address) : 'Address not available';

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const newStatus = !isFavorite;
      await toggleSaveProperty(property.id, isFavorite || false);
      onFavoriteToggle?.(property.id, newStatus);
    } catch (error) {
      console.error('Error toggling favorite status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.propertyCard}>
      <div className={styles.propertyContainer}>
        <div className={styles.imageContainer}>
          <img src={property.image_url || defaultImage} alt={property.title || 'Property image'} className={styles.propertyImage} onError={(e: any) => e.currentTarget.src = defaultImage} />
          
          {/* Price Overlay with enhanced details */}
          {property.price && (
            <div className={styles.priceOverlay}>
              <span className={styles.price}>
                {typeof property.price === 'string' ? property.price : property.price ? `$${Number(property.price).toLocaleString()}` : 'Price not available'}
              </span>
              {property.operation_status_display && (
                <span className={styles.operationType}>
                  For {property.operation_status_display}
                </span>
              )}
            </div>
          )}
          
          {/* Enhanced Favorite Button */}
          <button 
            className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteActive : ''}`}
            onClick={handleFavoriteClick}
            disabled={isLoading}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill={isFavorite ? '#FF6B6B' : 'none'} 
              stroke={isFavorite ? '#FF6B6B' : '#fff'} 
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
        
        <div className={styles.propertyDetails}>
          <div className={styles.propertyHeader}>
            {property.title && <h3 className={styles.title}>{property.title}</h3>}
            <p className={styles.address}>{formattedAddress}</p>
          </div>
          
          {/* Enhanced Property Specifications */}
          <div className={styles.propertySpecs}>
            {property.rooms !== undefined && (
              <div className={styles.specItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v10c0 5.5 3.8 7.7 9 9 5.2-1.3 9-3.5 9-9V7l-10-5z"/>
                  <rect x="8" y="11" width="8" height="6" rx="1" fill="white"/>
                  <rect x="9" y="9" width="6" height="3" rx="0.5" fill="white"/>
                </svg>
                <span>{property.rooms} {property.rooms === 1 ? 'bedroom' : 'bedrooms'}</span>
              </div>
            )}
            
            {property.bathrooms !== undefined && (
              <div className={styles.specItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="2" width="20" height="20" rx="2"/>
                  <circle cx="8" cy="8" r="2" fill="white"/>
                  <rect x="12" y="12" width="8" height="8" rx="1" fill="white"/>
                  <rect x="6" y="16" width="4" height="4" rx="0.5" fill="white"/>
                </svg>
                <span>{property.bathrooms} {property.bathrooms === 1 ? 'bathroom' : 'bathrooms'}</span>
              </div>
            )}
            
            {property.squareMeters !== undefined && (
              <div className={styles.specItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="1"/>
                  <rect x="6" y="6" width="12" height="12" rx="0.5" fill="white" stroke="currentColor" strokeWidth="0.5"/>
                  <rect x="9" y="9" width="6" height="6" rx="0.3" fill="currentColor"/>
                </svg>
                <span>{property.squareMeters.toLocaleString()} m²</span>
              </div>
            )}
            
            {property.yearBuilt && (
              <div className={styles.specItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="9"/>
                  <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
                <span>Built {property.yearBuilt}</span>
              </div>
            )}
            
            {property.type && (
              <div className={styles.specItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span className={styles.propertyType}>
                  {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                </span>
              </div>
            )}
          </div>
          
          {/* Enhanced Description */}
          {property.description && (
            <div className={styles.description}>
              <p className={styles.descriptionText}>
                {property.description.length > 120 ? `${property.description.slice(0, 120)}...` : property.description}
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button className={styles.viewDetailsButton}>
              View Details
            </button>
            <button className={styles.contactButton}>
              Contact Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
