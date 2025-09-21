import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Property } from '../types';
import styles from '../styles/PropertyCard.module.css';
import { getCoverImage, getPropertyImages, FALLBACK_IMAGE } from '../utils/propertyImages';
import { formatPriceUSD, formatISODate } from '../utils/format';


interface PropertyCardProps {
  property: Property;
  showFullDetails?: boolean;
  onClick?: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  showFullDetails = false,
  onClick
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  // Thumbnails currently unused in simplified card but kept for potential hover previews
  const thumbnails = getPropertyImages(property); // max 3
  const coverImage = getCoverImage(property);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/property/${property.id}`);
    }
  };

  // Favorite/save feature removed

  const formatPrice = (price: string) => formatPriceUSD(price);
  const formatDate = (dateString: string) => formatISODate(dateString);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div className={styles.propertyCard} onClick={handleCardClick} role="button" tabIndex={0} onKeyDown={handleKeyDown} aria-label={property.title || `View property ${property.id}`}>
      {/* Image Section */}
      <div className={styles.imageContainer}>
        {/* Always show only the cover image for a simpler home view */}
        <img
          src={imageError ? FALLBACK_IMAGE : coverImage}
          alt={property.title || `Property in ${property.city}`}
          className={styles.propertyImage}
          onError={() => setImageError(true)}
          loading="lazy"
        />

  {/* Favorite/save feature removed */}

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
