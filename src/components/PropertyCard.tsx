import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Property } from '../types';
import styles from '../styles/PropertyCard.module.css';

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

  // Get the cover image for the property card main display
  const getCoverImage = (property: Property): string => {
    // First check if property has uploaded images with a cover image
    if (property.images && property.images.length > 0) {
      const coverImage = property.images.find(img => img.is_cover);
      if (coverImage) {
        return coverImage.image_url;
      }
      // If no cover image is set, use the first uploaded image
      const sortedImages = property.images.sort((a, b) => a.display_order - b.display_order);
      return sortedImages[0].image_url;
    }

    // Fallback to single image_url if available
    if (property.image_url) {
      return property.image_url;
    }

  // Final fallback: neutral placeholder (prefer not to show a type-based sample image)
  return '/ubika-logo.png';
  };

  // Get property images for gallery navigation (if multiple images exist)
  const getPropertyImages = (property: Property): string[] => {
    // First check if property has uploaded images
    if (property.images && property.images.length > 0) {
      // Sort images (cover first, then display order) and limit to 3 for the card grid
      return property.images
        .sort((a, b) => {
          if (a.is_cover && !b.is_cover) return -1;
          if (!a.is_cover && b.is_cover) return 1;
          return a.display_order - b.display_order;
        })
        .slice(0, 3)
        .map(img => img.image_url);
    }

  // Fallback to a single neutral placeholder image when no uploaded images exist
  return ['/ubika-logo.png'];
  };

  const images = getPropertyImages(property);
  const coverImage = getCoverImage(property);
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

  // Favorite/save feature removed

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
        {/* If multiple images exist, show them as a 3-image grid (max 3 images). Otherwise show single cover image. */}
        {images.length > 1 ? (
          // Two images: show two halves side-by-side (50% / 50%)
          images.length === 2 ? (
            <div className={styles.gridTwo}>
              {images.map((src, idx) => (
                <img
                  key={idx}
                  src={imageError ? '/properties/casa-moderna.jpg' : src}
                  alt={property.title || `Property in ${property.city}`}
                  className={styles.halfImage}
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              ))}
            </div>
          ) : (
            // Three or more images: show cover as half width and two stacked quarters on the right
            <div className={styles.gridThree}>
              <img
                src={imageError ? '/properties/casa-moderna.jpg' : images[0]}
                alt={property.title || `Property in ${property.city}`}
                className={styles.halfCover}
                onError={() => setImageError(true)}
                loading="lazy"
              />
              <div className={styles.rightStack}>
                <img
                  src={imageError ? '/properties/casa-moderna.jpg' : images[1]}
                  alt={property.title || `Property in ${property.city}`}
                  className={styles.quarterImage}
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
                <img
                  src={imageError ? '/properties/casa-moderna.jpg' : images[2]}
                  alt={property.title || `Property in ${property.city}`}
                  className={styles.quarterImage}
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              </div>
            </div>
          )
        ) : (
          <img
            src={imageError ? '/properties/casa-moderna.jpg' : (images.length > 0 ? images[0] : coverImage)}
            alt={property.title || `Property in ${property.city}`}
            className={styles.propertyImage}
            onError={() => setImageError(true)}
          />
        )}

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
