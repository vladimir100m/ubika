import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Property } from '../types';
import styles from '../styles/PropertyCard.module.css';

interface PropertyCardProps {
  property: Property;
  isFavorite?: boolean;
  onFavoriteToggle?: (propertyId: number) => void;
  showFullDetails?: boolean;
  onClick?: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isFavorite = false,
  onFavoriteToggle,
  showFullDetails = false,
  onClick
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  // Generate multiple images based on property type
  const getPropertyImages = (property: Property): string[] => {
    const baseImages = [
      '/properties/casa-moderna.jpg',
      '/properties/apartamento-moderno.jpg',
      '/properties/villa-lujo.jpg'
    ];

    const typeImages: { [key: string]: string[] } = {
      'house': ['/properties/casa-moderna.jpg', '/properties/casa-campo.jpg', '/properties/casa-colonial.jpg'],
      'apartment': ['/properties/apartamento-moderno.jpg', '/properties/apartamento-ciudad.jpg', '/properties/departamento-familiar.jpg'],
      'villa': ['/properties/villa-lujo.jpg', '/properties/casa-lago.jpg', '/properties/casa-playa.jpg'],
      'penthouse': ['/properties/penthouse-lujo.jpg', '/properties/loft-urbano.jpg'],
      'cabin': ['/properties/cabana-bosque.jpg', '/properties/cabana-montana.jpg', '/properties/cabana-playa.jpg'],
      'loft': ['/properties/loft-urbano.jpg', '/properties/penthouse-lujo.jpg'],
      'duplex': ['/properties/duplex-moderno.jpg', '/properties/casa-moderna.jpg']
    };

    const propertyType = property.type?.toLowerCase() || 'house';
    return typeImages[propertyType] || baseImages;
  };

  const images = getPropertyImages(property);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
    } else {
      setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/property/${property.id}`);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(property.id);
    }
  };

  const formatPrice = (price: string) => {
    // Remove any existing formatting and add proper formatting
    const numericPrice = price.replace(/[^\d]/g, '');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseInt(numericPrice));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={styles.propertyCard} onClick={handleCardClick}>
      {/* Image Section */}
      <div className={styles.imageContainer}>
        <img
          src={imageError ? '/properties/casa-moderna.jpg' : images[currentImageIndex]}
          alt={property.title || `Property in ${property.city}`}
          className={styles.propertyImage}
          onError={() => setImageError(true)}
        />
        
        {/* Image Navigation */}
        {images.length > 1 && (
          <>
            <button
              className={`${styles.imageNav} ${styles.prevBtn}`}
              onClick={(e) => {
                e.stopPropagation();
                handleImageNavigation('prev');
              }}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              className={`${styles.imageNav} ${styles.nextBtn}`}
              onClick={(e) => {
                e.stopPropagation();
                handleImageNavigation('next');
              }}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className={styles.imageCounter}>
            {currentImageIndex + 1} / {images.length}
          </div>
        )}

        {/* Favorite Button */}
        <button
          className={`${styles.favoriteBtn} ${isFavorite ? styles.favoriteActive : ''}`}
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill={isFavorite ? "#e74c3c" : "none"}
              stroke={isFavorite ? "#e74c3c" : "#fff"}
              strokeWidth="2"
            />
          </svg>
        </button>

        {/* Status Badge */}
        {property.operation_status_display && (
          <div className={`${styles.statusBadge} ${styles[property.operation_status || '']}`}>
            {property.operation_status_display}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={styles.content}>
        {/* Price */}
        <div className={styles.price}>
          {formatPrice(property.price)}
          {property.operation_status === 'rent' && <span className={styles.period}>/month</span>}
        </div>

        {/* Title */}
        <h3 className={styles.title}>
          {property.title || `${property.type} in ${property.city}`}
        </h3>

        {/* Property Details */}
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>🛏️</span>
            <span>{property.rooms} beds</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>🚿</span>
            <span>{property.bathrooms} baths</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>📐</span>
            <span>{property.squareMeters} m²</span>
          </div>
        </div>

        {/* Location */}
        <div className={styles.location}>
          <span className={styles.locationIcon}>📍</span>
          <span>{property.address}, {property.city}, {property.state}</span>
        </div>

        {/* Property Type */}
        <div className={styles.propertyType}>
          <span className={styles.typeIcon}>🏠</span>
          <span>{property.type}</span>
        </div>

        {showFullDetails && (
          <>
            {/* Description */}
            {property.description && (
              <div className={styles.description}>
                <p>{property.description}</p>
              </div>
            )}

            {/* Additional Details */}
            <div className={styles.additionalDetails}>
              {property.yearBuilt && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Year Built:</span>
                  <span className={styles.value}>{property.yearBuilt}</span>
                </div>
              )}
              
              {property.zip_code && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>ZIP Code:</span>
                  <span className={styles.value}>{property.zip_code}</span>
                </div>
              )}

              <div className={styles.detailRow}>
                <span className={styles.label}>Status:</span>
                <span className={styles.value}>{property.status}</span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.label}>Listed:</span>
                <span className={styles.value}>{formatDate(property.created_at)}</span>
              </div>

              {property.updated_at !== property.created_at && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Updated:</span>
                  <span className={styles.value}>{formatDate(property.updated_at)}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button className={styles.viewDetailsBtn}>
            View Details
          </button>
          <button className={styles.contactBtn}>
            Contact Agent
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
