import React, { useState } from 'react';
import styles from '../styles/PropertyCard.module.css';
import mobileStyles from '../styles/Mobile.module.css';
import { Property } from '../types';
import LazyImage from './LazyImage';
import { useUser } from '@auth0/nextjs-auth0/client';
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
  const { user } = useUser();
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
      className={`${styles.card} ${mobileStyles.mobileCard}`}
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
      <div className={mobileStyles.cardImageContainer}>
        <LazyImage 
          src={props.image_url} 
          alt={`Image of property at ${props.address}`} 
          className={mobileStyles.mobileCardImage} 
        />
        <div className={mobileStyles.badgeContainer}>
          <span className={mobileStyles.priceBadge} aria-label={`Price: ${props.price}`}>{props.price}</span>
        </div>
        <button 
          className={`${mobileStyles.favoriteButton} ${props.isFavorite ? mobileStyles.isFavorite : ''}`}
          onClick={handleFavoriteToggle}
          disabled={isSaving}
          aria-label={props.isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isSaving ? '⏳' : (props.isFavorite ? '❤️' : '🤍')}
        </button>
      </div>
      <div className={mobileStyles.mobileCardDetails}>
        <p className={mobileStyles.mobileAddress}>📍 {props.address}</p>
        <div className={mobileStyles.mobileInfo}>
          <span className={mobileStyles.infoItem}>🛏️ {props.rooms}</span>
          <span className={mobileStyles.infoItem}>🛁 {props.bathrooms}</span>
          <span className={mobileStyles.infoItem}>📐 {props.squareMeters} m²</span>
        </div>
        
        <div className={`${mobileStyles.expandedContent} ${isExpanded ? mobileStyles.show : ''}`}>
          <p className={mobileStyles.mobileDescription}>{props.description}</p>
          {props.yearBuilt && <p className={mobileStyles.mobileYearBuilt}>🏗️ Built in {props.yearBuilt}</p>}
          {(props.latitude && props.longitude) && (
            <div className={mobileStyles.mobileMapPreview}>
              <a 
                href={`https://maps.google.com/?q=${props.latitude},${props.longitude}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className={mobileStyles.viewMapButton}
              >
                <span className={mobileStyles.mapIcon}>🗺️</span> View on Map
              </a>
            </div>
          )}
        </div>
        
        <div className={mobileStyles.cardActions}>
          <button 
            className={mobileStyles.expandButton} 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
          <button 
            className={mobileStyles.contactButton}
            onClick={(e) => {
              e.stopPropagation();
              // You can implement contact functionality here
            }}
          >
            Contact Agent
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobilePropertyCard;