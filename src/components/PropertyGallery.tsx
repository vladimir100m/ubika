import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/PropertyGallery.module.css';

interface PropertyGalleryProps {
  images: string[];
  initialIndex?: number;
}

const PropertyGallery: React.FC<PropertyGalleryProps> = ({ images, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([]);
  
  const galleryRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;
  
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
  
  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'Escape') setIsLightboxOpen(false);
  };
  
  // Touch handlers for swipe functionality
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
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
    <div 
      className={styles.galleryContainer} 
      onKeyDown={handleKeyDown} 
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
  );
};

export default PropertyGallery;
