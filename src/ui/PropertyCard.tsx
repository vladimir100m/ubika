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

  // Helper: return black or white depending on background hex color for contrast
  const getContrastColor = (hex?: string) => {
    if (!hex) return '#000';
    const cleaned = hex.replace('#', '');
    const bigint = parseInt(cleaned.length === 3 ? cleaned.split('').map(c => c + c).join('') : cleaned, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    // Perceived luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#000' : '#fff';
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
          
          {/* Operation Status Badge (For Sale, For Rent) */}
          {property.operation_status && (
            <div
              className={`${styles.operationBadge} ${styles[property.operation_status.name?.toLowerCase() || 'sale']}`}
              title={property.operation_status?.display_name || 'Operation Type'}
              style={{
                background: property.operation_status.color || undefined,
                borderColor: property.operation_status.color || undefined,
                color: getContrastColor(property.operation_status.color || undefined),
              }}
            >
              <span className={styles.badgeIcon}>
                {property.operation_status.name?.toLowerCase() === 'sale' && '💰'}
                {property.operation_status.name?.toLowerCase() === 'buy' && '💰'}
                {property.operation_status.name?.toLowerCase() === 'rent' && '🔑'}
                {property.operation_status.name?.toLowerCase() === 'lease' && '🔑'}
              </span>
              <span className={styles.badgeText}>{property.operation_status?.display_name || 'Operation'}</span>
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


        {/* Location */}
        <div className={styles.location}>
          <span className={styles.locationIcon} aria-hidden>📍</span>
          <div className={styles.locationText}>
            <div className={styles.locationLine}>{property.address}</div>
            <div className={styles.locationCity}>{property.city}{property.state ? `, ${property.state}` : ''}</div>
          </div>
        </div>
        
        {/* Beds & Baths in single row */}
        <div className={styles.bedsAndBathsRow}>
          <div className={styles.bedBathItem}>
            <span className={styles.bedBathIcon} aria-hidden>🛏️</span>
            <div className={styles.bedBathMeta}>
              <span className={styles.bedBathCount}>{property.bedrooms ?? '—'}</span>
              <span className={styles.bedBathLabel}>beds</span>
            </div>
          </div>

          <div className={styles.bedBathItem}>
            <span className={styles.bedBathIcon} aria-hidden>🚿</span>
            <div className={styles.bedBathMeta}>
              <span className={styles.bedBathCount}>{property.bathrooms ?? '—'}</span>
              <span className={styles.bedBathLabel}>baths</span>
            </div>
          </div>

          <div className={styles.bedBathItem}>
            <span className={styles.bedBathIcon} aria-hidden>📐</span>
            <div className={styles.bedBathMeta}>
              <span className={styles.bedBathCount}>{property.sq_meters ?? property.squareMeters ?? '—'}</span>
              <span className={styles.bedBathLabel}>m²</span>
            </div>
          </div>
        </div>

        {/* Features of the Property like tag style and list */}
        {property.features && property.features.length > 0 && (
          <div className={styles.features} aria-label={`Features: ${property.features.slice(0,5).map(f=>f.name).join(', ')}`}>
            {property.features.slice(0, 5).map((feature) => (
              <span key={feature.id} className={styles.featureItem} title={feature.name}>
                {feature.name}
              </span>
            ))}

            {/* If there are more than 5 features, show a small "+N" indicator */}
            {property.features.length > 5 && (
              <span className={styles.moreCount} title={`${property.features.length - 5} more features`} aria-hidden={false}>
                +{property.features.length - 5}
              </span>
            )}
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
