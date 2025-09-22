import React from 'react';
import { Property } from '../types';
import { getAllPropertyImages } from '../utils/propertyImages';

interface PropertyImageCarouselProps {
  property: Property;
  isOpen: boolean;
  currentIndex: number;
  onRequestClose: () => void;
  onNavigate: (direction: 'next' | 'prev') => void;
  onSelectIndex: (index: number) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  imageLoading: boolean;
  setImageLoading: (loading: boolean) => void;
}

const PropertyImageCarousel: React.FC<PropertyImageCarouselProps> = ({
  property,
  isOpen,
  currentIndex,
  onRequestClose,
  onNavigate,
  onSelectIndex,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  imageLoading,
  setImageLoading
}) => {
  // Compute images and register hooks before any early returns so React hooks
  // are called in the same order on every render (avoids internal React errors).
  const images = getAllPropertyImages(property);
  const hasMultiple = images.length > 1;

  React.useEffect(() => {
    // only set loading when the carousel is open
    if (!isOpen) return;
    // whenever index changes, mark loading true until onLoad fires
    setImageLoading(true);
  }, [currentIndex, setImageLoading, isOpen]);

  if (!isOpen) return null;
  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onClick={onRequestClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onRequestClose(); }}
        style={{
          position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.9)', border: 'none',
          borderRadius: '50%', width: 50, height: 50, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', fontSize: 24, color: '#333', zIndex: 10001
        }}
      >×</button>

      <div style={{
        position: 'absolute', top: 20, left: 20, background: 'rgba(0,0,0,0.7)', color: 'white',
        padding: '8px 16px', borderRadius: 20, fontSize: 16, zIndex: 10001
      }}>
        {currentIndex + 1} of {images.length}
      </div>

      {hasMultiple && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
            style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 24, color: '#333', zIndex: 10001 }}
          >‹</button>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
            style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 24, color: '#333', zIndex: 10001 }}
          >›</button>
        </>
      )}

      <div
        style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={images[currentIndex]}
          alt={`Property image ${currentIndex + 1}`}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', opacity: imageLoading ? 0.7 : 1, transition: 'opacity 0.3s ease' }}
          onLoad={() => setImageLoading(false)}
        />
        {imageLoading && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: 20 }}>
            <div style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        )}
      </div>

      {hasMultiple && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, maxWidth: '90vw', overflowX: 'auto', padding: 10, background: 'rgba(0,0,0,0.7)', borderRadius: 12 }}>
          {images.map((image, i) => (
            <div key={i}
                 onClick={(e) => { e.stopPropagation(); onSelectIndex(i); }}
                 style={{ width: 60, height: 40, borderRadius: 4, overflow: 'hidden', cursor: 'pointer', border: currentIndex === i ? '2px solid white' : '2px solid transparent', opacity: currentIndex === i ? 1 : 0.7, transition: 'all 0.2s ease' }}>
              <img src={image} alt={`Thumbnail ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyImageCarousel;
