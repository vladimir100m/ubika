'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Property } from '../types';
import styles from '../styles/PropertyCard.module.css';
import { getCoverImageRaw, getPropertyImagesRaw, FALLBACK_IMAGE } from '../lib/propertyImageUtils';
import useResolvedImage from '../lib/useResolvedImage';
import { formatPropertyPriceCompact, formatPropertyDate, formatPropertySize, formatPropertyBedsBaths } from '../lib/formatPropertyUtils';


interface PropertyCardProps {
  property: Property;
  showFullDetails?: boolean;
  onClick?: () => void;
  isSaved?: boolean;
  onSaveToggle?: () => void;
  onEdit?: () => void;
  hideActions?: boolean;
  onDelete?: () => void;
  showEditDelete?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  showFullDetails = false,
  onClick,
  onEdit,
  hideActions = false,
  onDelete,
  showEditDelete = false
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get all images sorted by display order, with cover images first
  const allImages = property.images ? 
    [...property.images].sort((a, b) => {
      if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
      return (a.display_order || 0) - (b.display_order || 0);
    }) : [];
  
  const rawCover = getCoverImageRaw(property);
  const coverImage = useResolvedImage(rawCover) || FALLBACK_IMAGE;
  
  // Use current image if available, otherwise use cover
  const currentImage = allImages.length > 0 ? allImages[currentImageIndex]?.image_url : null;
  const displayImage = useResolvedImage(currentImage) || coverImage;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/property/${property.id}`);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
    setImageError(false);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
    setImageError(false);
  };

  // Favorite/save feature removed

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
        {/* Display current image with navigation if multiple images exist */}
        <img
          src={imageError ? FALLBACK_IMAGE : displayImage}
          alt={property.title || `Property in ${property.city}`}
          className={styles.propertyImage}
          onError={() => setImageError(true)}
          loading="lazy"
        />

        {/* Image Navigation Controls */}
        {allImages.length > 1 && (
          <>
            <button
              className={`${styles.imageNavButton} ${styles.prevButton}`}
              onClick={handlePrevImage}
              title="Previous image"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              className={`${styles.imageNavButton} ${styles.nextButton}`}
              onClick={handleNextImage}
              title="Next image"
              aria-label="Next image"
            >
              ›
            </button>
            <div className={styles.imageIndicator}>
              {currentImageIndex + 1}/{allImages.length}
            </div>
          </>
        )}

  {/* Favorite/save feature removed */}

        {/* Status Badge */}
        {property.property_status && (
          <div className={`${styles.statusBadge} ${styles[property.property_status.name || '']}`}>
            {property.property_status?.display_name || 'Status'}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={styles.content}>
        {/* Price */}
        <div className={styles.price}>
          {formatPropertyPriceCompact(property.price)}
        </div>

        {/* Title */}
        <h3 className={styles.title}>
          {property.title}
        </h3>

        {/* Property Details */}
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>🛏️</span>
            <span>{property.bedrooms} beds</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>🚿</span>
            <span>{property.bathrooms} baths</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>📐</span>
            <span>{property.sq_meters} m²</span>
          </div>
        </div>

        {/* Location */}
        <div className={styles.location}>
          <span className={styles.locationIcon}>📍</span>
          <span>{property.address}, {property.city}</span>
        </div>

        {/* Property Type */}
        <div className={styles.propertyType}>
          <span className={styles.typeIcon}>🏠</span>
          <span>{property.property_type?.display_name || 'Property'}</span>
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
              {property.year_built && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Year Built:</span>
                  <span className={styles.value}>{property.year_built}</span>
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
                <span className={styles.value}>{property.property_status?.display_name || 'N/A'}</span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.label}>Listed:</span>
                <span className={styles.value}>{formatPropertyDate(property.created_at)}</span>
              </div>

              {property.updated_at && property.updated_at !== property.created_at && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Updated:</span>
                  <span className={styles.value}>{formatPropertyDate(property.updated_at)}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Action Buttons */}
        {!hideActions && (
          <div className={styles.actions}>
            {showEditDelete ? (
              <>
                <button className={styles.viewDetailsBtn} onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }}>
                  ✏️ Edit
                </button>
                <button className={styles.contactBtn} onClick={(e) => { e.stopPropagation(); onDelete && onDelete(); }}>
                  🗑️ Delete
                </button>
              </>
            ) : (
              <button className={styles.viewDetailsBtn} onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}>
                🔍 View Details
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;
