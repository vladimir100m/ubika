'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/PropertyGallery.module.css';

import { getAllPropertyImages } from '../lib/propertyImages';
import { Property } from '../types';

interface PropertyGalleryProps {
  property: Property;
  initialIndex?: number;
}

const PropertyGallery: React.FC<PropertyGalleryProps> = ({ property, initialIndex = 0 }) => {
  const images = getAllPropertyImages(property);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([]);
  const isWheelScrollingRef = useRef(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  const galleryRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  
  // Minimum swipe distance (in px) - adaptive based on device
  const minSwipeDistance = deviceType === 'mobile' ? 30 : 50;
  // Wheel scroll threshold - adaptive based on device
  const wheelScrollThreshold = deviceType === 'mobile' ? 50 : 100;
  
  // Device detection effect
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      if (width <= 768 && isTouchDevice) {
        setDeviceType('mobile');
      } else if (width <= 1024 && isTouchDevice) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };
    
    detectDevice();
    window.addEventListener('resize', detectDevice);
    
    return () => {
      window.removeEventListener('resize', detectDevice);
    };
  }, []);
  
  // Preload images
  useEffect(() => {
    if (images && images.length > 0) {
      const loadStatuses = new Array(images.length).fill(false);
      
      images.forEach((src, index) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          loadStatuses[index] = true;
          setImagesLoaded([...loadStatuses]);
        };
      });
    }
  }, [images]);
  
  if (!images || images.length === 0) {
    return <div className={styles.noImages}>No images available</div>;
  }
  
  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };
  
  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };
  
  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };
  
  const toggleLightbox = () => {
    setIsLightboxOpen(!isLightboxOpen);
  };
  
    // Enhanced keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        handlePrev();
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        handleNext();
        break;
      case 'Escape':
        if (isLightboxOpen) {
          e.preventDefault();
          setIsLightboxOpen(false);
        }
        break;
      case 'Enter':
      case ' ':
        if (!isLightboxOpen) {
          e.preventDefault();
          setIsLightboxOpen(true);
        }
        break;
      case 'Home':
        e.preventDefault();
        setCurrentIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setCurrentIndex(images.length - 1);
        break;
    }
  };

  // Enhanced wheel/touchpad navigation for cross-device compatibility
  const handleWheel = (e: React.WheelEvent) => {
    // Enhanced Mac trackpad detection
    const isMacTrackpad = e.deltaMode === 0 && Math.abs(e.deltaX) > 0;
    const isWindowsTrackpad = e.deltaMode === 0 && Math.abs(e.deltaY) % 1 !== 0;
    const isTrackpad = isMacTrackpad || isWindowsTrackpad || e.deltaMode === 0;
    
    // Mac trackpad specific thresholds (much more sensitive)
    const macTrackpadThreshold = 8;
    const generalThreshold = isTrackpad ? 15 : wheelScrollThreshold;
    const currentThreshold = isMacTrackpad ? macTrackpadThreshold : generalThreshold;

    // Debounce wheel events to prevent rapid navigation - shorter for Mac trackpad
  if (isWheelScrollingRef.current) return;
    
  isWheelScrollingRef.current = true;
  const debounceTime = isMacTrackpad ? 100 : 150;
  setTimeout(() => { isWheelScrollingRef.current = false; }, debounceTime);

    // Prevent default scrolling when in lightbox or when trackpad navigation occurs
    if (isLightboxOpen || (isTrackpad && (Math.abs(e.deltaX) > currentThreshold || Math.abs(e.deltaY) > currentThreshold))) {
      e.preventDefault();
    }

    // Priority 1: Horizontal scrolling (Mac trackpad left/right swipe)
    if (Math.abs(e.deltaX) > currentThreshold) {
      if (e.deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      return;
    }
    
    // Priority 2: Vertical scrolling for trackpads
    if (isTrackpad && Math.abs(e.deltaY) > currentThreshold) {
      // In lightbox mode, always allow vertical navigation
      if (isLightboxOpen) {
        if (e.deltaY > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
      // In gallery mode, allow for Mac trackpad with slightly higher threshold
      else if (isMacTrackpad && Math.abs(e.deltaY) > macTrackpadThreshold * 3) {
        if (e.deltaY > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
  };
  
  // Enhanced touch handlers for cross-device compatibility
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    
    // Prevent interference with other touch gestures on mobile
    if (e.targetTouches.length === 1) {
      e.stopPropagation();
    }
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.targetTouches.length === 1) {
      setTouchEnd(e.targetTouches[0].clientX);
      
      // Calculate distance for real-time feedback
      if (touchStart) {
        const distance = touchStart - e.targetTouches[0].clientX;
        // Provide visual feedback for swipe direction (optional enhancement)
        if (Math.abs(distance) > minSwipeDistance / 2) {
          // Could add visual swipe indicator here
        }
      }
    }
  };
  
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Enhanced swipe detection with velocity consideration
    const swipeVelocity = Math.abs(distance);
    const isQuickSwipe = swipeVelocity > minSwipeDistance * 1.5;
    
    if (isLeftSwipe && (swipeVelocity > minSwipeDistance || isQuickSwipe)) {
      e.preventDefault();
      handleNext();
    } else if (isRightSwipe && (swipeVelocity > minSwipeDistance || isQuickSwipe)) {
      e.preventDefault();
      handlePrev();
    }
    
    // Reset values
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleImageLoad = (index: number) => {
    setImagesLoaded((prev) => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
  };

  return (
    <>
      <div 
        className={styles.galleryContainer} 
        onKeyDown={handleKeyDown} 
        onWheel={handleWheel}
        tabIndex={0}
        ref={galleryRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        aria-label="Property Image Gallery"
      >
        <div className={styles.imageGrid}>
          <div className={styles.primaryImage}>
            <div className={styles.primaryImageWrapper} onClick={toggleLightbox} role="button" aria-label="Open Lightbox">
              <img 
                src={images[currentIndex]} 
                alt={`Property view ${currentIndex + 1}`} 
                className={styles.galleryImage}
                loading="lazy"
                onLoad={() => handleImageLoad(currentIndex)}
              />
              <div className={styles.imageOverlay}></div>
              <div className={styles.imageCount}>
                {currentIndex + 1} / {images.length}
              </div>
            </div>
          </div>
          {/* Add navigation buttons */}
          <button className={styles.imageNavButton} onClick={handlePrev} aria-label="Previous Image">&lt;</button>
          <button className={styles.imageNavButton} onClick={handleNext} aria-label="Next Image">&gt;</button>
        </div>
        <div className={styles.thumbnailsRow} aria-label="Image Thumbnails">
          {images.map((src, index) => (
            <div 
              key={index} 
              className={`${styles.thumbnail} ${currentIndex === index ? styles.activeThumbnail : ''}`} 
              onClick={() => handleThumbnailClick(index)}
              role="button"
              aria-label={`Thumbnail ${index + 1}`}
            >
              <img src={src} alt={`Thumbnail ${index + 1}`} className={styles.thumbnailImage} loading="lazy" />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className={styles.lightbox} 
          ref={lightboxRef}
          onKeyDown={handleKeyDown}
          onWheel={handleWheel}
          tabIndex={0}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          aria-label="Image Lightbox"
        >
          <div className={styles.lightboxHeader}>
            <div className={styles.lightboxCounter}>
              {currentIndex + 1} of {images.length}
            </div>
            <button 
              className={styles.lightboxClose} 
              onClick={toggleLightbox}
              aria-label="Close Lightbox"
            >
              ×
            </button>
          </div>
          
          <div className={styles.lightboxContent}>
            <img 
              src={images[currentIndex]} 
              alt={`Property view ${currentIndex + 1}`} 
              className={styles.lightboxImage}
              loading="lazy"
            />
            
            <div className={styles.lightboxNav}>
              <button 
                className={styles.navButton} 
                onClick={handlePrev}
                aria-label="Previous Image"
              >
                ‹
              </button>
              <button 
                className={styles.navButton} 
                onClick={handleNext}
                aria-label="Next Image"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyGallery;
