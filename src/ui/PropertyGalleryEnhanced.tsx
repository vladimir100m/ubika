import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import styles from '../../styles/PropertyGallery.module.css';

interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
  is_cover: boolean;
  display_order: number;
  file_size?: number;
  mime_type?: string;
  original_filename?: string;
  blob_path?: string;
  alt_text?: string;
  created_at: string;
  updated_at: string;
}

interface PropertyGalleryProps {
  images: PropertyImage[];
  propertyTitle?: string;
  showThumbnails?: boolean;
  allowFullscreen?: boolean;
  lazyLoad?: boolean;
  maxHeight?: number;
  className?: string;
  onImageClick?: (index: number) => void;
  priority?: boolean; // For cover image optimization
}

const PropertyGallery: React.FC<PropertyGalleryProps> = ({
  images = [],
  propertyTitle = 'Property',
  showThumbnails = true,
  allowFullscreen = true,
  lazyLoad = true,
  maxHeight = 600,
  className = '',
  onImageClick,
  priority = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Sort images: cover first, then by display_order
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return a.display_order - b.display_order;
  });

  const currentImage = sortedImages[currentIndex];

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  }, []);

  const handleImageError = useCallback((index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  }, []);

  const nextImage = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % sortedImages.length);
  }, [sortedImages.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + sortedImages.length) % sortedImages.length);
  }, [sortedImages.length]);

  const goToImage = useCallback((index: number) => {
    setCurrentIndex(index);
    if (onImageClick) {
      onImageClick(index);
    }
  }, [onImageClick]);

  const toggleFullscreen = useCallback(() => {
    if (allowFullscreen) {
      setIsFullscreen(prev => !prev);
    }
  }, [allowFullscreen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isFullscreen) {
        switch (e.key) {
          case 'ArrowLeft':
            prevImage();
            break;
          case 'ArrowRight':
            nextImage();
            break;
          case 'Escape':
            setIsFullscreen(false);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen, nextImage, prevImage]);

  // Generate srcSet for responsive images
  const generateSrcSet = (imageUrl: string) => {
    if (imageUrl.includes('blob.vercel-storage.com')) {
      // For Vercel blob URLs, we can add query parameters for optimization
      return `
        ${imageUrl}?w=400 400w,
        ${imageUrl}?w=800 800w,
        ${imageUrl}?w=1200 1200w,
        ${imageUrl} 1600w
      `.trim();
    }
    return imageUrl;
  };

  const generateSizes = () => {
    return "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw";
  };

  if (!sortedImages || sortedImages.length === 0) {
    return (
      <div className={`${styles.galleryContainer} ${className}`}>
        <div className={styles.noImages}>
          <div className={styles.placeholderIcon}>📷</div>
          <p>No images available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${styles.galleryContainer} ${className}`} style={{ maxHeight }}>
        {/* Main Image Display */}
        <div className={styles.mainImageContainer}>
          <div 
            className={styles.mainImage}
            onClick={toggleFullscreen}
            style={{ cursor: allowFullscreen ? 'zoom-in' : 'default' }}
          >
            {currentImage && !imageErrors.has(currentIndex) && (
              <Image
                src={currentImage.image_url}
                alt={currentImage.alt_text || `${propertyTitle} - Image ${currentIndex + 1}`}
                fill
                style={{ objectFit: 'cover' }}
                sizes={generateSizes()}
                priority={priority && currentIndex === 0} // Prioritize cover image
                loading={lazyLoad && !(priority && currentIndex === 0) ? 'lazy' : 'eager'}
                onLoad={() => handleImageLoad(currentIndex)}
                onError={() => handleImageError(currentIndex)}
                quality={90}
              />
            )}
            
            {imageErrors.has(currentIndex) && (
              <div className={styles.imageError}>
                <span>❌ Failed to load image</span>
              </div>
            )}

            {!loadedImages.has(currentIndex) && !imageErrors.has(currentIndex) && (
              <div className={styles.imageLoading}>
                <div className={styles.spinner}></div>
              </div>
            )}
          </div>

          {/* Navigation Arrows */}
          {sortedImages.length > 1 && (
            <>
              <button
                className={`${styles.navButton} ${styles.prevButton}`}
                onClick={prevImage}
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                className={`${styles.navButton} ${styles.nextButton}`}
                onClick={nextImage}
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className={styles.imageCounter}>
            {currentIndex + 1} / {sortedImages.length}
            {currentImage?.is_cover && (
              <span className={styles.coverBadge}>COVER</span>
            )}
          </div>
        </div>

        {/* Thumbnail Strip */}
        {showThumbnails && sortedImages.length > 1 && (
          <div className={styles.thumbnailContainer}>
            <div className={styles.thumbnailStrip}>
              {sortedImages.map((image, index) => (
                <div
                  key={image.id}
                  className={`${styles.thumbnail} ${
                    index === currentIndex ? styles.activeThumbnail : ''
                  }`}
                  onClick={() => goToImage(index)}
                >
                  <Image
                    src={image.image_url}
                    alt={image.alt_text || `Thumbnail ${index + 1}`}
                    width={80}
                    height={60}
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                    quality={70}
                  />
                  {image.is_cover && (
                    <div className={styles.thumbnailCoverBadge}>★</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className={styles.fullscreenOverlay} onClick={toggleFullscreen}>
          <div className={styles.fullscreenContainer}>
            <button
              className={styles.fullscreenClose}
              onClick={toggleFullscreen}
              aria-label="Close fullscreen"
            >
              ✕
            </button>
            
            <div className={styles.fullscreenImage}>
              {currentImage && (
                <Image
                  src={currentImage.image_url}
                  alt={currentImage.alt_text || `${propertyTitle} - Image ${currentIndex + 1}`}
                  fill
                  style={{ objectFit: 'contain' }}
                  quality={95}
                  priority
                />
              )}
            </div>

            {sortedImages.length > 1 && (
              <>
                <button
                  className={`${styles.fullscreenNav} ${styles.fullscreenPrev}`}
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  className={`${styles.fullscreenNav} ${styles.fullscreenNext}`}
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}

            <div className={styles.fullscreenCounter}>
              {currentIndex + 1} / {sortedImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyGallery;