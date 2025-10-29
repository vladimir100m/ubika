'use client';

import React, { useState, useEffect } from 'react';
import { Property, Neighborhood } from '../types';
import styles from '../styles/PropertyDetailCard.module.css';
import PropertyActions from './PropertyActions';
import { getCoverImageRaw, getPropertyImagesRaw } from '../lib/propertyImageUtils';
import { formatPropertyPriceCompact, formatPropertyDate, formatPropertySize } from '../lib/formatPropertyUtils';
import useResolvedImage from '../lib/useResolvedImage';
import { FALLBACK_IMAGE } from '../lib/propertyImageUtils';

interface PropertyDetailCardProps {
  property: Property;
  showContact?: boolean;
}

interface MainInfoItem {
  icon: string;
  label: string;
  value: string | number;
}

const PropertyDetailCard: React.FC<PropertyDetailCardProps> = ({
  property,
  showContact = true
}) => {
  const [neighborhoodData, setNeighborhoodData] = useState<Neighborhood | null>(null);
  const [loadingNeighborhood, setLoadingNeighborhood] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: "I'm interested in this property"
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Resolve cover image using the hook
  const rawCover = getCoverImageRaw(property);
  const coverImage = useResolvedImage(rawCover) || FALLBACK_IMAGE;

  useEffect(() => {
    const fetchNeighborhoodData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const propertyType = property.property_type?.display_name || 'Unknown';
        const response = await fetch(`${baseUrl}/api/neighborhoods?city=${encodeURIComponent(property.city)}&type=${encodeURIComponent(propertyType)}`, { cache: 'no-store' });
        if (response.ok) {
          const neighborhoods = await response.json();
          if (neighborhoods.length > 0) {
            setNeighborhoodData(neighborhoods[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching neighborhood data:', error);
      } finally {
        setLoadingNeighborhood(false);
      }
    };

    if (property.city) {
      fetchNeighborhoodData();
    }
  }, [property.city]);

  const images = getPropertyImagesRaw(property);

  // Helper function to determine availability status
  const isAvailable = property.property_status?.display_name?.toLowerCase() !== 'not_available';
  
  // Build main info items array
  const mainInfoItems: MainInfoItem[] = [
    { icon: '🛏️', label: 'Bedrooms', value: property.bedrooms || 'N/A' },
    { icon: '🚿', label: 'Bathrooms', value: property.bathrooms || 'N/A' },
    { icon: '📐', label: 'Square Meters', value: property.sq_meters ? `${property.sq_meters} m²` : 'N/A' }
  ];

  // Filter features into categories for highlights
  const getFeaturesByCategory = (category: string) => {
    return property.features?.filter(f => f.category === category).map(f => f.name) || [];
  };

  const indoorFeatures = getFeaturesByCategory('Interior');
  const outdoorFeatures = getFeaturesByCategory('Outdoor');
  const amenitiesFeatures = getFeaturesByCategory('Amenities');

  return (
    <div className={styles.propertyDetailCard}>
      {/* ===== HERO SECTION: PRICE, AVAILABILITY, LOCATION ===== */}
      <div className={styles.heroSection}>
        <div className={styles.heroHeader}>
          <div className={styles.priceAndStatus}>
            <h1 className={styles.heroPrice}>
              {formatPropertyPriceCompact(property.price)}
              {property.operation_status_id === 2 && <span className={styles.pricePeriod}>/mo</span>}
            </h1>
            <div className={styles.availabilityBadge} data-available={isAvailable}>
              <span className={styles.availabilityDot}></span>
              {isAvailable ? 'Available' : 'Not Available'}
            </div>
          </div>
          <PropertyActions propertyId={property.id} />
        </div>

        <h2 className={styles.heroTitle}>
          {property.title || `${property.property_type?.display_name || 'Home'} in ${property.city}`}
        </h2>

        <div className={styles.heroLocation}>
          📍 {property.address} • {property.city}
          {property.zip_code && <span className={styles.zipCode}>{property.zip_code}</span>}
        </div>
      </div>

      {/* ===== MAIN INFO: BEDS, BATHS, SIZE IN CLEAN GRID ===== */}
      <div className={styles.mainInfoSection}>
        <div className={styles.mainInfoGrid}>
          {mainInfoItems.map((item, idx) => (
            <div key={idx} className={styles.mainInfoCard}>
              <div className={styles.mainInfoIcon}>{item.icon}</div>
              <div className={styles.mainInfoContent}>
                <div className={styles.mainInfoValue}>{item.value}</div>
                <div className={styles.mainInfoLabel}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== HIGHLIGHTS: DISPLAY AS TAGS ===== */}
      {/* {property.features && property.features.length > 0 && (
        <div className={styles.highlightsSection}>
          <h3 className={styles.sectionHeading}>✨ Highlights</h3>
          <div className={styles.highlightsTags}>
            {property.features.slice(0, 8).map((feature) => (
              <span key={feature.id} className={styles.highlightTag}>
                {feature.name}
              </span>
            ))}
          </div>
        </div>
      )} */}

      {/* ===== DESCRIPTION ===== */}
      {property.description && (
        <div className={styles.descriptionSection}>
          <h3 className={styles.sectionHeading}>📋 About This Property</h3>
          <p className={styles.descriptionText}>{property.description}</p>
        </div>
      )}

      {/* Property Information */}
      <div className={styles.section}>
        <div className={styles.collapsibleHeader}>
          <h2 className={styles.propertyTitle}>📊 Details</h2>
        </div>
        <div id="section-info" className={`${styles.sectionBodyFade} ${styles.propertyInfo}`}>
          {/* Interior Section */}
          <div className={styles.factsCategory}>
            <h3 className={styles.categoryTitle}>🏠 Interior</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Beds</span>
                <span className={styles.infoValue}>{property.bedrooms}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Baths</span>
                <span className={styles.infoValue}>{property.bathrooms}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Size</span>
                <span className={styles.infoValue}>{property.sq_meters} m²</span>
              </div>
              {property.year_built && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Built</span>
                  <span className={styles.infoValue}>{property.year_built}</span>
                </div>
              )}
            </div>
          </div>

          {/* Property Section */}
          <div className={styles.factsCategory}>
            <h3 className={styles.categoryTitle}>🏢 Property</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Type</span>
                <span className={styles.infoValue}>{property.property_type?.display_name || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Status</span>
                <span className={styles.infoValue}>{property.property_status?.display_name || 'N/A'}</span>
              </div>
              {property.zip_code && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>ZIP</span>
                  <span className={styles.infoValue}>{property.zip_code}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>ID</span>
                <span className={styles.infoValue}>{property.id}</span>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className={styles.factsCategory}>
            <h3 className={styles.categoryTitle}>📍 Location</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Address</span>
                <span className={styles.infoValue}>{property.address}, {property.city}</span>
              </div>
              {property.lat != null && property.lng != null && (
                <>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Lat</span>
                    <span className={styles.infoValue}>{(property.lat as number).toFixed(4)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Lng</span>
                    <span className={styles.infoValue}>{(property.lng as number).toFixed(4)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Listing Details Section */}
          <div className={styles.factsCategory}>
            <h3 className={styles.categoryTitle}>📅 Listing</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Listed</span>
                <span className={styles.infoValue}>{formatPropertyDate(property.created_at)}</span>
              </div>
              {property.updated_at !== property.created_at && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Updated</span>
                  <span className={styles.infoValue}>{formatPropertyDate(property.updated_at)}</span>
                </div>
              )}
              {property.seller_id && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Seller ID</span>
                  <span className={styles.infoValue}>{property.seller_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== FEATURES BY CATEGORY: CLEAN CARDS ===== */}
      {(indoorFeatures.length > 0 || outdoorFeatures.length > 0 || amenitiesFeatures.length > 0) && (
        <div className={styles.featuresSection}>
          <h3 className={styles.sectionHeading}>🏠 Features</h3>
          
          <div className={styles.featuresCategoryGrid}>
            {/* {indoorFeatures.length > 0 && (
              <div className={styles.featureCategory}>
                <h4 className={styles.featureCategoryTitle}>🏠 Interior</h4>
                <ul className={styles.featureList}>
                  {indoorFeatures.map((name, idx) => (
                    <li key={idx}>✓ {name}</li>
                  ))}
                </ul>
              </div>
            )} */}
            
            {/* {outdoorFeatures.length > 0 && (
              <div className={styles.featureCategory}>
                <h4 className={styles.featureCategoryTitle}>🌳 Outdoor</h4>
                <ul className={styles.featureList}>
                  {outdoorFeatures.map((name, idx) => (
                    <li key={idx}>✓ {name}</li>
                  ))}
                </ul>
              </div>
            )} */}
            
            {/* {amenitiesFeatures.length > 0 && (
              <div className={styles.featureCategory}>
                <h4 className={styles.featureCategoryTitle}>✨ Amenities</h4>
                <ul className={styles.featureList}>
                  {amenitiesFeatures.map((name, idx) => (
                    <li key={idx}>✓ {name}</li>
                  ))}
                </ul>
              </div>
            )} */}
          </div>
        </div>
      )}

      {/* ===== LOCATION WITH MAP ===== */}
      <div className={styles.locationSection}>
        <h3 className={styles.sectionHeading}>📍 Location</h3>
        
        <div className={styles.locationContent}>
          <div className={styles.locationInfo}>
            <div className={styles.locationItem}>
              <span className={styles.locationLabel}>Address</span>
              <span className={styles.locationValue}>{property.address}</span>
            </div>
            <div className={styles.locationItem}>
              <span className={styles.locationLabel}>City</span>
              <span className={styles.locationValue}>{property.city}</span>
            </div>
            {property.zip_code && (
              <div className={styles.locationItem}>
                <span className={styles.locationLabel}>ZIP Code</span>
                <span className={styles.locationValue}>{property.zip_code}</span>
              </div>
            )}
            {property.lat && property.lng && (
              <div className={styles.locationCoordinates}>
                <span className={styles.locationLabel}>Coordinates</span>
                <span className={styles.locationValue}>{(property.lat as number).toFixed(4)}, {(property.lng as number).toFixed(4)}</span>
              </div>
            )}
          </div>

          {/* Simple embedded map placeholder - can integrate with Google Maps */}
          {property.lat && property.lng && (
            <div className={styles.mapPlaceholder}>
              <iframe
                width="100%"
                height="300"
                style={{ border: 0, borderRadius: '12px' }}
                loading="lazy"
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${property.lat},${property.lng}`}
              ></iframe>
            </div>
          )}
        </div>
      </div>

      {/* ===== ADDITIONAL DETAILS ===== */}
      <div className={styles.additionalDetailsSection}>
        <h3 className={styles.sectionHeading}>ℹ️ Additional Details</h3>
        
        <div className={styles.detailsGrid}>
          <div className={styles.detailsGridItem}>
            <span className={styles.detailsLabel}>Property Type</span>
            <span className={styles.detailsValue}>{property.property_type?.display_name || 'N/A'}</span>
          </div>
          
          <div className={styles.detailsGridItem}>
            <span className={styles.detailsLabel}>Status</span>
            <span className={styles.detailsValue}>{property.property_status?.display_name || 'N/A'}</span>
          </div>
          
          {property.year_built && (
            <div className={styles.detailsGridItem}>
              <span className={styles.detailsLabel}>Year Built</span>
              <span className={styles.detailsValue}>{property.year_built}</span>
            </div>
          )}
          
          <div className={styles.detailsGridItem}>
            <span className={styles.detailsLabel}>Listed Date</span>
            <span className={styles.detailsValue}>{formatPropertyDate(property.created_at)}</span>
          </div>
        </div>
      </div>

      {/* ===== CONTACT CTA ===== */}
      {showContact && (
        <div className={styles.contactSection}>
          <h3 className={styles.sectionHeading}>📞 Interested in This Property?</h3>
          <p className={styles.contactSubtext}>Contact the seller to schedule a viewing or ask questions</p>
          
          <div className={styles.contactCTA}>
            <button className={styles.ctaButtonPrimary}>
              💬 Schedule Viewing
            </button>
            <button className={styles.ctaButtonSecondary}>
              ❓ Ask Question
            </button>
          </div>

          <div className={styles.agentInfo}>
            <div className={styles.agentAvatar}>🏢</div>
            <div className={styles.agentDetails}>
              <p className={styles.agentName}>Ubika Real Estate</p>
              <p className={styles.agentContact}>info@ubika.com • +1 (555) 123-4567</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailCard;
