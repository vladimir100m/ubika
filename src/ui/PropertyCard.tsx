'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Property } from '../types';
import styles from '../styles/PropertyCard.module.css';
import { getCoverImageRaw, FALLBACK_IMAGE } from '../lib/propertyImageUtils';
import useResolvedImage from '../lib/useResolvedImage';
import { formatPropertyPriceCompact, formatPropertyDate } from '../lib/formatPropertyUtils';


interface PropertyCardProps {
  property: Property;
  showFullDetails?: boolean;
  onClick?: () => void;
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

  // Memoize sorted images to prevent recalculation on every render
  const allImages = useMemo(() => {
    if (!property.images) return [];
    return [...property.images].sort((a, b) => {
      if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
      return (a.display_order || 0) - (b.display_order || 0);
    });
  }, [property.images]);
  
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

  const handleImageNav = (direction: 'prev' | 'next', e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => 
      direction === 'prev' 
        ? prev === 0 ? allImages.length - 1 : prev - 1
        : prev === allImages.length - 1 ? 0 : prev + 1
    );
    setImageError(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleActionClick = (callback?: () => void, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    callback?.();
  };

  return (
    <div className={styles.propertyCard} onClick={handleCardClick} role="button" tabIndex={0} onKeyDown={handleKeyDown} aria-label={property.title || `View property ${property.id}`}>
      {/* Image Section */}
      <div className={styles.imageContainer}>
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
              onClick={(e) => handleImageNav('prev', e)}
              title="Previous image"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              className={`${styles.imageNavButton} ${styles.nextButton}`}
              onClick={(e) => handleImageNav('next', e)}
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

        {/* Status Badges - Property Status and Operation Status */}
        <div className={styles.badgesContainer}>
          {/* Property Status Badge (Published, Draft, etc.) */}
          {property.property_status && (
            <div className={`${styles.statusBadge} ${styles[property.property_status.name || '']}`}>
              {property.property_status?.display_name || 'Status'}
            </div>
          )}
          
          {/* Operation Status Badge (For Sale, For Rent) */}
          {property.operation_status && (
            <div className={`${styles.operationBadge} ${styles[property.operation_status.name || '']}`}>
              {property.operation_status?.display_name || 'Operation'}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className={styles.content}>
        {/* Price */}
        <div className={styles.price}>
          {formatPropertyPriceCompact(property.price)}
        </div>

        {/* Title */}
        {/* <h3 className={styles.title}>
          {property.title}
        </h3> */}
        {/* Property Type */}
        {/* <div className={styles.propertyType}>
          <span className={styles.typeIcon}>🏠</span>
          <span>{property.property_type?.display_name || 'Property'}</span>
        </div> */}

        {/* Location */}
        <div className={styles.location}>
          <span className={styles.locationIcon}>📍</span>
          <span>{property.address}, {property.city}</span>
        </div>
        
        {/* Beds & Baths in single row */}
        <div className={styles.bedsAndBathsRow}>
          <div className={styles.bedBathItem}>
            <span className={styles.bedBathIcon}>🛏️</span>
            <span className={styles.bedBathCount}>{property.bedrooms}</span>
            {/* <span className={styles.bedBathLabel}>beds</span> */}
          </div>
          
          <div className={styles.bedBathItem}>
            <span className={styles.bedBathIcon}>🚿</span>
            <span className={styles.bedBathCount}>{property.bathrooms}</span>
            {/* <span className={styles.bedBathLabel}>baths</span> */}
          </div>
          <div className={styles.bedBathItem}>
            <span className={styles.bedBathIcon}>📐</span>
            <span className={styles.bedBathCount}>{property.sq_meters}</span>
            {/* <span className={styles.bedBathLabel}>m²</span> */}
          </div>
        </div>

        {/* Features of the Property like tag style and list */}
        {property.features && property.features.length > 0 && (
          <div className={styles.features}>
            {property.features.slice(0, 5).map((feature) => (
              <span key={feature.id} className={styles.featureItem}>
                {feature.name}
              </span>
            ))}
          </div>
        )}

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
                <button 
                  className={styles.viewDetailsBtn} 
                  onClick={(e) => handleActionClick(onEdit, e)}
                >
                  ✏️ Edit
                </button>
                <button 
                  className={styles.contactBtn} 
                  onClick={(e) => handleActionClick(onDelete, e)}
                >
                  🗑️ Delete
                </button>
              </>
            ) : (
              <button 
                className={styles.viewDetailsBtn} 
                onClick={(e) => handleActionClick(onClick, e)}
              >
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
