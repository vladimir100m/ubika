import styles from '../styles/Home.module.css';
import popupStyles from '../styles/PropertyPopup.module.css';
import React, { useState, useCallback, useMemo } from 'react';
import { Property } from '../types';
import { getAllPropertyImagesRaw } from '../lib/propertyImageUtils';
import PropertyImageGrid from './PropertyImageGrid';
import { formatNumberWithCommas } from '../lib/formatPropertyUtils';
import PropertyImageCarousel from './PropertyImageCarousel';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';

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

  // Description expansion state
  const [expandedDescription, setExpandedDescription] = useState(false);

  // Load Google Maps
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });
  
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

  // Description truncation logic
  const MAX_DESC_LENGTH = 300;
  const truncatedDescription = useMemo(() => {
    if (!selectedProperty.description) return '';
    if (selectedProperty.description.length <= MAX_DESC_LENGTH) return selectedProperty.description;
    return selectedProperty.description.substring(0, MAX_DESC_LENGTH) + '...';
  }, [selectedProperty.description]);

  const hasMoreDescription = useMemo(
    () => selectedProperty.description && selectedProperty.description.length > MAX_DESC_LENGTH,
    [selectedProperty.description]
  );

  // Full location string
  const fullLocation = useMemo(() => {
    const parts = [selectedProperty.address, selectedProperty.city, selectedProperty.state, selectedProperty.zip_code]
      .filter(Boolean);
    return parts.join(', ');
  }, [selectedProperty.address, selectedProperty.city, selectedProperty.state, selectedProperty.zip_code]);

  // Map center coordinates
  const mapCenter = useMemo(
    () => ({ lat: selectedProperty.lat || 0, lng: selectedProperty.lng || 0 }),
    [selectedProperty.lat, selectedProperty.lng]
  );

  // Price per square meter
  const pricePerSqm = useMemo(() => {
    const sqm = selectedProperty.sq_meters || selectedProperty.squareMeters;
    if (!sqm || sqm === 0) return null;
    return Math.round(selectedProperty.price / sqm);
  }, [selectedProperty.price, selectedProperty.sq_meters, selectedProperty.squareMeters]);

  // Year built / Age
  const yearBuilt = useMemo(
    () => selectedProperty.year_built || selectedProperty.yearbuilt,
    [selectedProperty.year_built, selectedProperty.yearbuilt]
  );

  const propertyAge = useMemo(() => {
    if (!yearBuilt) return null;
    return new Date().getFullYear() - yearBuilt;
  }, [yearBuilt]);

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
                
                {/* ===== HERO SECTION: MOBILE-FIRST ZILLOW-INSPIRED ===== */}
                <div className={popupStyles.heroSectionMobile}>
                  {/* Status Badge */}
                  <div className={popupStyles.statusBadgeMobile} data-available={isAvailable}>
                    <span className={popupStyles.statusDot}></span>
                    <span className={popupStyles.statusText}>
                      {selectedProperty.operation_status_id === 2 ? 'For rent' : 'For sale'}
                    </span>
                  </div>

                  {/* Price */}
                  <h1 className={popupStyles.heroPriceMobile}>
                    ${formattedPrice}
                    {selectedProperty.operation_status_id === 2 && <span className={popupStyles.pricePeriodMobile}>/mo</span>}
                  </h1>

                  {/* Beds & Baths in single row */}
                  <div className={popupStyles.bedsAndBathsRow}>
                    <div className={popupStyles.bedBathItem}>
                      <span className={popupStyles.bedBathIcon}>🛏️</span>
                      <span className={popupStyles.bedBathCount}>{selectedProperty.bedrooms}</span>
                      <span className={popupStyles.bedBathLabel}>beds</span>
                    </div>
                    <div className={popupStyles.bedBathItem}>
                      <span className={popupStyles.bedBathIcon}>🚿</span>
                      <span className={popupStyles.bedBathCount}>{selectedProperty.bathrooms}</span>
                      <span className={popupStyles.bedBathLabel}>baths</span>
                    </div>
                  </div>

                  {/* Full Address */}
                  <p className={popupStyles.addressLineHero}>{fullLocation}</p>

                  {/* Action Button */}
                  <button className={popupStyles.getPreQualifiedBtn}>
                    <span className={popupStyles.dollarIcon}>$</span>
                    <span>Get pre-qualified</span>
                  </button>
                </div>

                {/* ===== MAIN INFO: ZILLOW-STYLE 2-COLUMN PROFESSIONAL STATS GRID ===== */}
                <div className={popupStyles.mainInfoSection}>
                  <div className={popupStyles.zilowStatsGrid}>
                    {/* Row 1 - Column 1: Property Type */}
                    {selectedProperty.property_type && (
                      <div className={popupStyles.zilowStatCard}>
                        <div className={popupStyles.zilowStatIcon}>🏢</div>
                        <div className={popupStyles.zilowStatContent}>
                          <div className={popupStyles.zilowStatValue}>{selectedProperty.property_type.display_name}</div>
                          <div className={popupStyles.zilowStatLabel}>Property Type</div>
                        </div>
                      </div>
                    )}

                    {/* Row 1 - Column 2: Built Year */}
                    {yearBuilt && (
                      <div className={popupStyles.zilowStatCard}>
                        <div className={popupStyles.zilowStatIcon}>�</div>
                        <div className={popupStyles.zilowStatContent}>
                          <div className={popupStyles.zilowStatValue}>
                            {yearBuilt}
                            {propertyAge && <span className={popupStyles.ageTextSmall}> ({propertyAge}y)</span>}
                          </div>
                          <div className={popupStyles.zilowStatLabel}>Built in</div>
                        </div>
                      </div>
                    )}

                    {/* Row 2 - Column 1: Square Meters */}
                    {selectedProperty.sq_meters && (
                      <div className={popupStyles.zilowStatCard}>
                        <div className={popupStyles.zilowStatIcon}>📐</div>
                        <div className={popupStyles.zilowStatContent}>
                          <div className={popupStyles.zilowStatValue}>{selectedProperty.sq_meters} m²</div>
                          <div className={popupStyles.zilowStatLabel}>Lot size</div>
                        </div>
                      </div>
                    )}

                    {/* Row 2 - Column 2: Price per Square Meter */}
                    {pricePerSqm && (
                      <div className={popupStyles.zilowStatCard}>
                        <div className={popupStyles.zilowStatIcon}>💰</div>
                        <div className={popupStyles.zilowStatContent}>
                          <div className={popupStyles.zilowStatValue}>${pricePerSqm.toLocaleString()}</div>
                          <div className={popupStyles.zilowStatLabel}>Price/m²</div>
                        </div>
                      </div>
                    )}

                    {/* Row 3 - Column 1: Zestimate (Property Value Estimate) */}
                    {selectedProperty.price && (
                      <div className={popupStyles.zilowStatCard}>
                        <div className={popupStyles.zilowStatIcon}>💎</div>
                        <div className={popupStyles.zilowStatContent}>
                          <div className={popupStyles.zilowStatValue}>${formattedPrice}</div>
                          <div className={popupStyles.zilowStatLabel}>Estimate $</div>
                        </div>
                      </div>
                    )}

                    {/* Row 3 - Column 2: Monthly HOA/Community Cost */}
                    {selectedProperty.operation_status_id === 2 && (
                      <div className={popupStyles.zilowStatCard}>
                        <div className={popupStyles.zilowStatIcon}>🏘️</div>
                        <div className={popupStyles.zilowStatContent}>
                          <div className={popupStyles.zilowStatValue}>${formattedPrice}/mo</div>
                          <div className={popupStyles.zilowStatLabel}>Community Cost</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ===== HIGHLIGHTS: DISPLAY AS TAGS ===== */}
                {selectedProperty.features && selectedProperty.features.length > 0 && (
                  <div className={popupStyles.highlightsSection}>
                    <h3 className={popupStyles.sectionHeading}>What's special</h3>
                    <div className={popupStyles.highlightsTags}>
                      {selectedProperty.features.slice(0, 10).map((feature) => (
                        <span key={feature.id} className={popupStyles.highlightTag}>
                          {feature.name.toUpperCase()}
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
                    <p className={popupStyles.descriptionText}>
                      {expandedDescription ? selectedProperty.description : truncatedDescription}
                    </p>
                    {hasMoreDescription && (
                      <button
                        onClick={() => setExpandedDescription(!expandedDescription)}
                        className={popupStyles.readMoreBtn}
                      >
                        {expandedDescription ? 'Show Less' : 'Read More'}
                      </button>
                    )}
                  </div>
                )}

                {/* ===== LOCATION INFO SECTION ===== */}
                {fullLocation && (
                  <div className={popupStyles.locationInfoSection}>
                    <h3 className={popupStyles.sectionHeading}>📍 Location</h3>
                    <div className={popupStyles.locationInfoCard}>
                      <div className={popupStyles.locationDetails}>
                        <div className={popupStyles.addressBlock}>
                          <p className={popupStyles.addressText}>{fullLocation}</p>
                        </div>
                        {selectedProperty.lat && selectedProperty.lng && (
                          <div className={popupStyles.coordinatesBlock}>
                            <span className={popupStyles.coordinateItem}>Lat: {selectedProperty.lat.toFixed(4)}</span>
                            <span className={popupStyles.coordinateItem}>Lng: {selectedProperty.lng.toFixed(4)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== GOOGLE MAP SECTION ===== */}
                {selectedProperty.lat && selectedProperty.lng && isLoaded && (
                  <div className={popupStyles.mapSection}>
                    <h3 className={popupStyles.sectionHeading}>🗺️ Map</h3>
                    <div className={popupStyles.mapContainer}>
                      <GoogleMap
                        zoom={15}
                        center={mapCenter}
                        mapContainerClassName={popupStyles.googleMap}
                        options={{
                          disableDefaultUI: false,
                          zoomControl: true,
                          mapTypeControl: false,
                          fullscreenControl: true,
                          streetViewControl: false,
                        }}
                      >
                        <Marker
                          position={mapCenter}
                          title={selectedProperty.title}
                          icon={{
                            path: 'M12 0C7.04 0 3 4.04 3 9c0 5.85 9 23 9 23s9-17.15 9-23c0-4.96-4.04-9-9-9zm0 12c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
                            fillColor: '#667eea',
                            fillOpacity: 1,
                            strokeColor: '#fff',
                            strokeWeight: 2,
                            scale: 2,
                          }}
                        />
                      </GoogleMap>
                    </div>
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
