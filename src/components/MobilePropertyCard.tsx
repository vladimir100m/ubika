import React, { useState } from 'react';
import styles from '../styles/PropertyCard.module.css';
import mobileStyles from '../styles/Mobile.module.css';
import { Property } from '../types';
import LazyImage from './LazyImage';
import { useSession } from 'next-auth/react';
import { toggleSaveProperty } from '../utils/savedPropertiesApi';

export type MobilePropertyCardProps = Pick<
  Property,
  | 'image_url'
  | 'description'
  | 'price'
  | 'rooms'
  | 'bathrooms'
  | 'address'
  | 'squareMeters'
  | 'id'
> & {
  yearBuilt?: number;
  latitude?: number;
  longitude?: number;
  onClick?: () => void;
  onFavoriteToggle?: (id: number, newStatus: boolean) => void;
  isFavorite?: boolean;
};

const MobilePropertyCard: React.FC<MobilePropertyCardProps> = (props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;
  const [isSaving, setIsSaving] = useState(false);
  
  const handleCardClick = () => {
    if (props.onClick) {
      props.onClick(); // Navigate to MobilePropertyDetail
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/api/auth/login';
      return;
    }

    if (isSaving || !props.id) return; // Prevent multiple clicks or proceed if no id
    
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
      
      // Check if it's an auth error
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        // Redirect to login
        window.location.href = '/api/auth/login';
        return;
      }
      
      alert('Failed to update favorite status. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={styles.card}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`View details for property at ${props.address}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick();
        }
      }}
    >
      <div className={styles.imageContainer}>
        <LazyImage 
          src={props.image_url} 
          alt={`Image of property at ${props.address}`} 
          className={styles.propertyImage}
        />
        
        {/* Price overlay */}
        {props.price && (
          <div className={styles.priceOverlay}>
            <div className={styles.priceTag}>
              {props.price}
            </div>
          </div>
        )}
        
        {/* Favorite button */}
        <button 
          className={`${styles.favoriteButton} ${props.isFavorite ? styles.favorited : ''}`}
          onClick={handleFavoriteToggle}
          disabled={isSaving}
          aria-label={props.isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={props.isFavorite ? '#ff4757' : 'none'} stroke={props.isFavorite ? '#ff4757' : '#666'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {/* Property status badge */}
        <div className={styles.statusBadge}>
          For Sale
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.propertyHeader}>
          <p className={styles.address}>{props.address}</p>
        </div>
        
        <div className={styles.propertySpecs}>
          {props.rooms !== undefined && (
            <div className={styles.spec}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              <span>{props.rooms} bed{props.rooms !== 1 ? 's' : ''}</span>
            </div>
          )}
          
          {props.bathrooms !== undefined && (
            <div className={styles.spec}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                <path d="M9 6a3 3 0 1 1 6 0"/>
                <path d="M12 9v3"/>
                <path d="M8 15h8"/>
                <path d="M8 19h8"/>
              </svg>
              <span>{props.bathrooms} bath{props.bathrooms !== 1 ? 's' : ''}</span>
            </div>
          )}
          
          {props.squareMeters !== undefined && (
            <div className={styles.spec}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <path d="M9 9h6v6H9z"/>
              </svg>
              <span>{props.squareMeters} m²</span>
            </div>
          )}
        </div>

        {props.description && (
          <div className={`${styles.expandedContent} ${isExpanded ? styles.show : ''}`}>
            <p className={styles.description}>
              {isExpanded ? props.description : (props.description.length > 100 ? `${props.description.slice(0, 100)}...` : props.description)}
            </p>
            {props.yearBuilt && <p className={styles.description}>Built in {props.yearBuilt}</p>}
            {(props.latitude && props.longitude) && (
              <div style={{ marginTop: '12px' }}>
                <a 
                  href={`https://maps.google.com/?q=${props.latitude},${props.longitude}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.viewButton}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  View on Map
                </a>
              </div>
            )}
          </div>
        )}

        <div className={styles.cardFooter}>
          <div className={styles.propertyActions}>
            <button 
              className={styles.contactButton}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </button>
            <button 
              className={styles.viewButton}
              onClick={(e) => {
                e.stopPropagation();
                // You can implement contact functionality here
              }}
            >
              Contact
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobilePropertyCard;