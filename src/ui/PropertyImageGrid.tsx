// 'use client' directive: this component uses hooks (useMemo and a custom hook) and must run on the client.
"use client";

import React, { useMemo } from 'react';
import { Property } from '../types';
import galleryStyles from '../styles/StyledGallery.module.css';
import { getAllPropertyImages } from '../lib/propertyImages';
import useResolvedImage from '../lib/useResolvedImage';

const ResolvedImg: React.FC<{ src: string; alt?: string }> = ({ src, alt }) => {
  const resolved = useResolvedImage(src) || '/ubika-logo.png';
  return (
    <img
      src={resolved}
      alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    />
  );
};

interface PropertyImageGridProps {
  property: Property;
  onOpenCarousel: (startIndex: number) => void;
}

/**
 * Displays the responsive 1-3 image grid and optional overlay counters/button.
 * Pure presentational; no parent state leakage besides callback.
 */
const PropertyImageGrid: React.FC<PropertyImageGridProps> = ({ property, onOpenCarousel }) => {
  // Compute grid layout (mirrors previous inline logic in PropertyPopup)
  const gridLayout = useMemo(() => {
  const allImages = getAllPropertyImages(property);
    const imageCount = Math.min(allImages.length, 3);
    switch (imageCount) {
      case 1:
        return {
          gridTemplateColumns: '1fr',
            gridTemplateRows: '1fr',
            images: allImages.slice(0, 1),
            showViewAllButton: allImages.length > 1,
        };
      case 2:
        return {
          gridTemplateColumns: '2fr 1fr',
            gridTemplateRows: '1fr',
            images: allImages.slice(0, 2),
            showViewAllButton: allImages.length > 2,
        };
      case 3:
      default:
        return {
          gridTemplateColumns: '2fr 1fr',
            gridTemplateRows: '1fr 1fr',
            images: allImages.slice(0, 3),
            showViewAllButton: allImages.length > 3,
        };
    }
  }, [property]);

  const allPropertyImages = getAllPropertyImages(property);

  return (
    <div className={galleryStyles.styledGallery}
         style={{
           display: 'grid',
           gridTemplateColumns: gridLayout.gridTemplateColumns,
           gridTemplateRows: gridLayout.gridTemplateRows,
           gap: '8px',
           height: '100%',
           width: '100%',
           borderRadius: '12px',
           overflow: 'hidden',
           backgroundColor: '#f7f7f7'
         }}>
      {gridLayout.images.map((image: string, index: number) => {
        const isMainImage = index === 0;
        const imageCount = gridLayout.images.length;
        let gridColumn: string, gridRow: string;
        if (imageCount === 1) {
          gridColumn = '1';
          gridRow = '1';
        } else if (imageCount === 2) {
          gridColumn = index === 0 ? '1' : '2';
          gridRow = '1';
        } else { // 3 images
          if (index === 0) {
            gridColumn = '1';
            gridRow = '1 / span 2';
          } else {
            gridColumn = '2';
            gridRow = index === 1 ? '1' : '2';
          }
        }
     return (
    <div key={index}
      style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', gridColumn, gridRow }}
      onClick={() => onOpenCarousel(index)}>
      <ResolvedImg src={image} alt={`Property image ${index + 1}`} />
            {isMainImage && (
              <div style={{
                position: 'absolute', bottom: '16px', left: '16px', zIndex: 5,
                backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white', borderRadius: '4px',
                padding: '4px 10px', fontSize: '14px'
              }}>
                1 of {allPropertyImages.length}
              </div>
            )}
            {index === gridLayout.images.length - 1 && allPropertyImages.length > 3 && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'white', fontSize: '18px', fontWeight: 'bold'
              }}>
                +{allPropertyImages.length - 3} more
              </div>
            )}
          </div>
        );
      })}

      {gridLayout.showViewAllButton && (
        <div style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 5 }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: '#2a2a33', border: 'none', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer',
            fontSize: '14px', fontWeight: '600', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.2s ease'
          }}
                  onClick={(e) => { e.stopPropagation(); onOpenCarousel(0); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {allPropertyImages.length} Photos
          </button>
        </div>
      )}
    </div>
  );
};

export default PropertyImageGrid;
