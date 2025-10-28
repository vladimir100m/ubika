import styles from '../styles/Home.module.css';
import popupStyles from '../styles/PropertyPopup.module.css';
import React, { useState, useCallback, useMemo } from 'react';
import { Property } from '../types';
import { getAllPropertyImagesRaw } from '../lib/propertyImageUtils';
import PropertyImageGrid from './PropertyImageGrid';
import { formatNumberWithCommas } from '../lib/formatPropertyUtils';
import PropertyImageCarousel from './PropertyImageCarousel';

/**
 * Utility function to extract and filter features by category
 */
const getFeaturesByCategory = (
  features: Array<{ name: string; category?: string }> | undefined,
  category: string
): string[] => {
  return features?.filter(f => f.category === category).map(f => f.name) || [];
};

/**
 * Initial contact form state
 */
const INITIAL_CONTACT_FORM = {
  name: '',
  phone: '',
  email: '',
  message: "I'm interested in this property"
};

interface PropertyPopupProps {
  selectedProperty: Property;
  onClose: () => void;
}

export default function PropertyPopup({ selectedProperty, onClose }: PropertyPopupProps) {
  // Carousel and UI state
  const [showCarousel, setShowCarousel] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);

  // Contact form state
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactFormData, setContactFormData] = useState(INITIAL_CONTACT_FORM);

  // Touch state for carousel swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // ============ MEMOIZED COMPUTATIONS ============

  const allImages = useMemo(() => getAllPropertyImagesRaw(selectedProperty), [selectedProperty]);

  const isAvailable = useMemo(
    () => selectedProperty.property_status?.display_name?.toLowerCase() !== 'not_available',
    [selectedProperty.property_status?.display_name]
  );

  const formattedPrice = useMemo(
    () => formatNumberWithCommas(selectedProperty.price),
    [selectedProperty.price]
  );

  const { indoorFeatures, outdoorFeatures, amenitiesFeatures } = useMemo(
    () => ({
      indoorFeatures: getFeaturesByCategory(selectedProperty.features, 'Interior'),
      outdoorFeatures: getFeaturesByCategory(selectedProperty.features, 'Outdoor'),
      amenitiesFeatures: getFeaturesByCategory(selectedProperty.features, 'Amenities'),
    }),
    [selectedProperty.features]
  );

  // ============ EVENT HANDLERS ============

  const handleImageChange = useCallback(
    (direction: 'next' | 'prev') => {
      setImageLoading(true);
      const totalImages = allImages.length || 1;
      setCurrentImageIndex(prev =>
        direction === 'next'
          ? (prev + 1) % totalImages
          : (prev - 1 + totalImages) % totalImages
      );
    },
    [allImages.length]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0]?.clientX ?? null);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0]?.clientX ?? null);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (Math.abs(distance) > 50) {
      handleImageChange(distance > 0 ? 'next' : 'prev');
    }
  }, [touchStart, touchEnd, handleImageChange]);

  const handleCloseContactForm = useCallback(() => {
    setShowContactForm(false);
    setContactFormData(INITIAL_CONTACT_FORM);
  }, []);

  const handleContactFormChange = useCallback((field: string, value: string) => {
    setContactFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: selectedProperty.title || 'Property',
      text: selectedProperty.description || 'Check this property',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [selectedProperty.title, selectedProperty.description]);

  return (
    <>
        <div className={styles.propertyDetailOverlay} onClick={onClose}>
          <div className={styles.propertyDetailCard} onClick={(e) => e.stopPropagation()}>
            <div className={popupStyles.topRightButtons}>
              <button
                onClick={(e)=>{e.stopPropagation(); onClose();}}
                aria-label="Close property popup"
                className={popupStyles.iconButton}
              >
                <span className={popupStyles.closeIcon}>×</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                aria-label="Share property details"
                className={popupStyles.iconButton}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="M8.59 13.51l6.83 3.98" />
                  <path d="M15.41 6.51L8.59 10.49" />
                </svg>
              </button>
            </div>
            
            <div className={`${styles.propertyDetailHeader} ${popupStyles.headerFixedHeight}`}>
              <PropertyImageGrid
                property={selectedProperty}
                onOpenCarousel={(startIndex) => {
                  setCurrentImageIndex(startIndex);
                  setShowCarousel(true);
                }}
              />
            </div>
            <div className={`${styles.propertyDetailContent} ${popupStyles.contentNoPadding}`}>
              <div className={`${styles.propertyDetailBody} ${popupStyles.bodyConstrained}`}>
                
                {/* ===== HERO SECTION: PRICE, AVAILABILITY, LOCATION ===== */}
                <div className={popupStyles.heroSection}>
                  <div className={popupStyles.heroHeader}>
                    <div className={popupStyles.priceAndStatus}>
                      <h1 className={popupStyles.heroPrice}>
                        ${formattedPrice}
                        {selectedProperty.operation_status_id === 2 && <span className={popupStyles.pricePeriod}>/mo</span>}
                      </h1>
                      <div className={popupStyles.availabilityBadge} data-available={isAvailable}>
                        <span className={popupStyles.availabilityDot}></span>
                        {isAvailable ? 'Available' : 'Not Available'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== MAIN INFO: BEDS, BATHS, SIZE IN CLEAN GRID ===== */}
                <div className={popupStyles.mainInfoSection}>
                  <div className={popupStyles.mainInfoGrid}>
                    <div className={popupStyles.mainInfoCard}>
                      <div className={popupStyles.mainInfoIcon}>🛏️</div>
                      <div className={popupStyles.mainInfoContent}>
                        <div className={popupStyles.mainInfoValue}>{selectedProperty.bedrooms}</div>
                        <div className={popupStyles.mainInfoLabel}>Bedrooms</div>
                      </div>
                    </div>

                    <div className={popupStyles.mainInfoCard}>
                      <div className={popupStyles.mainInfoIcon}>�</div>
                      <div className={popupStyles.mainInfoContent}>
                        <div className={popupStyles.mainInfoValue}>{selectedProperty.bathrooms}</div>
                        <div className={popupStyles.mainInfoLabel}>Bathrooms</div>
                      </div>
                    </div>

                    <div className={popupStyles.mainInfoCard}>
                      <div className={popupStyles.mainInfoIcon}>📐</div>
                      <div className={popupStyles.mainInfoContent}>
                        <div className={popupStyles.mainInfoValue}>{selectedProperty.sq_meters} m²</div>
                        <div className={popupStyles.mainInfoLabel}>Square Meters</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== HIGHLIGHTS: DISPLAY AS TAGS ===== */}
                {selectedProperty.features && selectedProperty.features.length > 0 && (
                  <div className={popupStyles.highlightsSection}>
                    <h3 className={popupStyles.sectionHeading}>✨ Highlights</h3>
                    <div className={popupStyles.highlightsTags}>
                      {selectedProperty.features.slice(0, 8).map((feature) => (
                        <span key={feature.id} className={popupStyles.highlightTag}>
                          {feature.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ===== FEATURES: ORGANIZED BY CATEGORY ===== */}
                {(indoorFeatures.length > 0 || outdoorFeatures.length > 0 || amenitiesFeatures.length > 0) && (
                  <div className={popupStyles.featuresSection}>
                    <h3 className={popupStyles.sectionHeading}>🏠 Features & Amenities</h3>
                    
                    <div className={popupStyles.featuresCategoryGrid}>
                      {indoorFeatures.length > 0 && (
                        <div className={popupStyles.featureCategory}>
                          <h4 className={popupStyles.featureCategoryTitle}>🏠 Interior</h4>
                          <ul className={popupStyles.featureList}>
                            {indoorFeatures.map((feature, idx) => (
                              <li key={idx} className={popupStyles.featureItem}>✓ {feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {outdoorFeatures.length > 0 && (
                        <div className={popupStyles.featureCategory}>
                          <h4 className={popupStyles.featureCategoryTitle}>🌳 Outdoor</h4>
                          <ul className={popupStyles.featureList}>
                            {outdoorFeatures.map((feature, idx) => (
                              <li key={idx} className={popupStyles.featureItem}>✓ {feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {amenitiesFeatures.length > 0 && (
                        <div className={popupStyles.featureCategory}>
                          <h4 className={popupStyles.featureCategoryTitle}>⭐ Amenities</h4>
                          <ul className={popupStyles.featureList}>
                            {amenitiesFeatures.map((feature, idx) => (
                              <li key={idx} className={popupStyles.featureItem}>✓ {feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== DESCRIPTION SECTION ===== */}
                {selectedProperty.description && (
                  <div className={popupStyles.descriptionSection}>
                    <h3 className={popupStyles.sectionHeading}>📝 About This Property</h3>
                    <p className={popupStyles.descriptionText}>{selectedProperty.description}</p>
                  </div>
                )}

                {/* ===== CONTACT CTA SECTION ===== */}
                {/* <div className={popupStyles.contactCTASection}>
                  <h3 className={popupStyles.sectionHeading}>Get in Touch</h3>
                  <div className={popupStyles.contactCTAButtons}>
                    <button className={popupStyles.btnPrimaryLarge} onClick={() => setShowContactForm(true)}>
                      📞 Contact Agent
                    </button>
                    <button className={popupStyles.btnSecondaryLarge}>
                      📅 Schedule Tour
                    </button>
                  </div>
                </div> */}
                
                {/* All content sections */}
                <div className={popupStyles.whiteBg}>
                  {/* Contact Agent Section */}
                  <div className={popupStyles.contactSection}>
                    <div className={popupStyles.contactInner}>
                      {!showContactForm ? (
                        // Initial state - just show the contact button
                        <div className={`${popupStyles.contactIntro} ${showContactForm ? popupStyles.hidden : ''}`}>
                          <h3>Contact an agent about this home</h3>
                          <p>Get more information about this property, schedule a viewing, or ask any questions you may have.</p>
                          <button 
                            onClick={() => setShowContactForm(true)}
                            className={popupStyles.contactPrimaryBtn}
                          >
                            Contact Agent
                          </button>
                        </div>
                      ) : (
                        // Contact form state
                        <div className={`${popupStyles.contactCard} ${showContactForm ? '' : popupStyles.hidden}`}>
                          <div className={popupStyles.contactHeader}>
                            <h3>Contact an agent</h3>
                            <button
                              onClick={handleCloseContactForm}
                              className={popupStyles.contactCloseBtn}
                              aria-label="Close contact form"
                            >
                              ×
                            </button>
                          </div>

                          <div className={popupStyles.contactFieldsGrid}>
                            <div>
                              <input 
                                className={popupStyles.inputField}
                                type="text" 
                                placeholder="Your Name" 
                                value={contactFormData.name}
                                onChange={(e) => handleContactFormChange('name', e.target.value)}
                              />
                            </div>
                            <div>
                              <input 
                                className={popupStyles.inputField}
                                type="text" 
                                placeholder="Phone" 
                                value={contactFormData.phone}
                                onChange={(e) => handleContactFormChange('phone', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className={popupStyles.contactFieldSingle}>
                            <input 
                              className={popupStyles.inputField}
                              type="email" 
                              placeholder="Email" 
                              value={contactFormData.email}
                              onChange={(e) => handleContactFormChange('email', e.target.value)}
                            />
                            <textarea 
                              className={popupStyles.textareaField}
                              rows={4} 
                              placeholder="I'm interested in this property" 
                              value={contactFormData.message}
                              onChange={(e) => handleContactFormChange('message', e.target.value)}
                            />
                          </div>

                          <div className={popupStyles.formActions}>
                            <button 
                              onClick={handleCloseContactForm}
                              className={popupStyles.btnCancel}
                            >
                              Cancel
                            </button>
                            <button 
                              className={popupStyles.btnSend}
                            >
                              Send Message
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PropertyImageCarousel
          property={selectedProperty}
          isOpen={showCarousel}
          currentIndex={currentImageIndex}
          onRequestClose={() => setShowCarousel(false)}
          onNavigate={handleImageChange}
          onSelectIndex={(i) => setCurrentImageIndex(i)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          imageLoading={imageLoading}
          setImageLoading={setImageLoading}
        />
    </>
  );
}
