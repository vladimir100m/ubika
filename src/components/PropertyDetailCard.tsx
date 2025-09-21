import React, { useState, useEffect, useRef } from 'react';
import { Property } from '../types';
import styles from '../styles/PropertyDetailCard.module.css';

interface PropertyFeature {
  id: number;
  name: string;
  category: string;
  icon: string;
}

interface Neighborhood {
  id: number;
  name: string;
  description: string;
  subway_access: string;
  dining_options: string;
  shopping_access: string;
  highway_access: string;
}

interface PropertyDetailCardProps {
  property: Property;
  showContact?: boolean;
}

const PropertyDetailCard: React.FC<PropertyDetailCardProps> = ({
  property,
  showContact = true
}) => {
  const [propertyFeatures, setPropertyFeatures] = useState<PropertyFeature[]>([]);
  const [neighborhoodData, setNeighborhoodData] = useState<Neighborhood | null>(null);
  const [loadingFeatures, setLoadingFeatures] = useState(true);

  // Favorite/save feature removed
  // Collapsible state
  const [openSections, setOpenSections] = useState<{[key:string]: boolean}>({
    description: true,
    info: true,
    features: true,
    neighborhood: true,
    contact: true
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoadingFeatures(true);
      try {
        // Fetch property features
        const featuresResponse = await fetch(`/api/properties/features?propertyId=${property.id}`, { signal: controller.signal });
        if (featuresResponse.ok) {
          const features = await featuresResponse.json();
          setPropertyFeatures(features);
        }

        // Fetch neighborhood data
        const neighborhoodResponse = await fetch(`/api/neighborhoods?city=${encodeURIComponent(property.city)}&type=${encodeURIComponent(property.type)}`, { signal: controller.signal });
        if (neighborhoodResponse.ok) {
          const neighborhoods = await neighborhoodResponse.json();
          if (neighborhoods.length > 0) {
            setNeighborhoodData(neighborhoods[0]);
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching property data:', error);
      } finally {
        setLoadingFeatures(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [property.id, property.city, property.type]);

  const formatPrice = (price: string) => {
    const numericPrice = price.replace(/[^\d]/g, '');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseInt(numericPrice));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get the cover image for the property detail display
  const getCoverImage = (property: Property): string => {
    // First check if property has uploaded images with a cover image
    if (property.images && property.images.length > 0) {
      const coverImage = property.images.find(img => img.is_cover);
      if (coverImage) {
        return coverImage.image_url;
      }
      // If no cover image is set, use the first uploaded image
      const sortedImages = [...property.images].sort((a, b) => a.display_order - b.display_order);
      return sortedImages[0].image_url;
    }

    // Fallback to single image_url if available
    if (property.image_url) {
      return property.image_url;
    }

  // Final fallback: neutral placeholder
  return '/ubika-logo.png';
  };

  const getPropertyImages = (property: Property): string[] => {
    // First check if property has uploaded images
    if (property.images && property.images.length > 0) {
      return [...property.images]
        .sort((a, b) => {
          // Sort by is_cover first, then by display_order
          if (a.is_cover && !b.is_cover) return -1;
          if (!a.is_cover && b.is_cover) return 1;
          return a.display_order - b.display_order;
        })
        .map(img => img.image_url);
    }

  // Fallback to neutral placeholder images array
  return ['/ubika-logo.png'];
  };

  const images = getPropertyImages(property);

  return (
    <div className={styles.propertyDetailCard}>
      {/* Header Section */}
      <div className={styles.header}>
  {/* Favorite/save feature removed */}
        <div className={styles.priceSection}>
          <div className={styles.price}>
            {formatPrice(property.price)}
            {property.operation_status === 'rent' && <span className={styles.period}>/month</span>}
          </div>
          <div className={`${styles.statusBadge} ${styles[property.operation_status || '']}`}>
            {property.operation_status_display || property.status}
          </div>
        </div>
        
        <h1 className={styles.title}>
          {property.title || `${property.type} in ${property.city}`}
        </h1>
        
        <div className={styles.location}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>{property.address}, {property.city}, {property.state}, {property.country}</span>
        </div>
      </div>

      {/* Main Details */}
      <div className={styles.mainDetails}>
        <div className={styles.keyDetails}>
          <div className={styles.detailItem}>
            <div className={styles.detailIcon}>🛏️</div>
            <div>
              <div className={styles.detailValue}>{property.rooms}</div>
              <div className={styles.detailLabel}>Bedrooms</div>
            </div>
          </div>
          
          <div className={styles.detailItem}>
            <div className={styles.detailIcon}>🚿</div>
            <div>
              <div className={styles.detailValue}>{property.bathrooms}</div>
              <div className={styles.detailLabel}>Bathrooms</div>
            </div>
          </div>
          
          <div className={styles.detailItem}>
            <div className={styles.detailIcon}>📐</div>
            <div>
              <div className={styles.detailValue}>{property.squareMeters}</div>
              <div className={styles.detailLabel}>m²</div>
            </div>
          </div>
          
          <div className={styles.detailItem}>
            <div className={styles.detailIcon}>🏠</div>
            <div>
              <div className={styles.detailValue}>{property.type}</div>
              <div className={styles.detailLabel}>Property Type</div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {property.description && (
        <div className={styles.section}>
          <div className={`${styles.collapsibleHeader}`} onClick={() => toggleSection('description')}>
            <h2 className={styles.propertyTitle}>About This Property</h2>
            <button className={styles.collapseToggleBtn} aria-expanded={openSections.description} aria-controls="section-description">
              {openSections.description ? 'Hide' : 'Show'}
              <span aria-hidden="true">{openSections.description ? '▴' : '▾'}</span>
            </button>
          </div>
          <div id="section-description" className={!openSections.description ? styles.collapsedContent : styles.sectionBodyFade}>
            <p className={styles.description}>{property.description}</p>
          </div>
        </div>
      )}

      {/* Property Information */}
      <div className={styles.section}>
        <div className={styles.collapsibleHeader} onClick={() => toggleSection('info')}>
          <h2 className={styles.propertyTitle}>Property Information</h2>
          <button className={styles.collapseToggleBtn} aria-expanded={openSections.info} aria-controls="section-info">
            {openSections.info ? 'Hide' : 'Show'} <span aria-hidden="true">{openSections.info ? '▴' : '▾'}</span>
          </button>
        </div>
        <div id="section-info" className={`${!openSections.info ? styles.collapsedContent : styles.sectionBodyFade} ${styles.propertyInfo}`}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Property ID</span>
              <span className={styles.infoValue}>{property.id}</span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Property Type</span>
              <span className={styles.infoValue}>{property.type}</span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Status</span>
              <span className={styles.infoValue}>{property.status}</span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Operation</span>
              <span className={styles.infoValue}>{property.operation_status_display || 'For Sale'}</span>
            </div>
            
            {property.yearBuilt && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Year Built</span>
                <span className={styles.infoValue}>{property.yearBuilt}</span>
              </div>
            )}
            
            {property.zip_code && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>ZIP Code</span>
                <span className={styles.infoValue}>{property.zip_code}</span>
              </div>
            )}
            
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Listed Date</span>
              <span className={styles.infoValue}>{formatDate(property.created_at)}</span>
            </div>
            
            {property.updated_at !== property.created_at && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Last Updated</span>
                <span className={styles.infoValue}>{formatDate(property.updated_at)}</span>
              </div>
            )}
            
            {property.latitude && property.longitude && (
              <>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Latitude</span>
                  <span className={styles.infoValue}>{property.latitude.toFixed(6)}</span>
                </div>
                
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Longitude</span>
                  <span className={styles.infoValue}>{property.longitude.toFixed(6)}</span>
                </div>
              </>
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

      {/* Property Features */}
      {loadingFeatures ? (
        <div className={styles.section}>
          <div className={styles.collapsibleHeader}>
            <h2 className={styles.propertyTitle}>Property Features</h2>
          </div>
          <div className={styles.loadingFeatures}>Loading features...</div>
        </div>
      ) : propertyFeatures.length > 0 ? (
        <div className={styles.section}>
          <div className={styles.collapsibleHeader} onClick={() => toggleSection('features')}>
            <h2 className={styles.propertyTitle}>Property Features</h2>
            <button className={styles.collapseToggleBtn} aria-expanded={openSections.features} aria-controls="section-features">
              {openSections.features ? 'Hide' : 'Show'} <span aria-hidden="true">{openSections.features ? '▴' : '▾'}</span>
            </button>
          </div>
          <div id="section-features" className={!openSections.features ? styles.collapsedContent : styles.sectionBodyFade}>
            <div className={styles.featuresGrid}>
              {propertyFeatures.map((feature) => (
                <div key={feature.id} className={styles.featureItem}>
                  <span className={styles.featureIcon}>{feature.icon}</span>
                  <span className={styles.featureName}>{feature.name}</span>
                  <span className={styles.featureCategory}>({feature.category})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Neighborhood Information */}
      {neighborhoodData && (
        <div className={styles.section}>
          <div className={styles.collapsibleHeader} onClick={() => toggleSection('neighborhood')}>
            <h2 className={styles.propertyTitle}>Neighborhood: {neighborhoodData.name}</h2>
            <button className={styles.collapseToggleBtn} aria-expanded={openSections.neighborhood} aria-controls="section-neighborhood">
              {openSections.neighborhood ? 'Hide' : 'Show'} <span aria-hidden="true">{openSections.neighborhood ? '▴' : '▾'}</span>
            </button>
          </div>
          <div id="section-neighborhood" className={!openSections.neighborhood ? styles.collapsedContent : styles.sectionBodyFade}>
            <div className={styles.neighborhoodInfo}>
              <p className={styles.neighborhoodDescription}>
                {neighborhoodData.description}
              </p>
              <div className={styles.neighborhoodDetails}>
                <div className={styles.neighborhoodItem}>
                  <h4>🚇 Subway Access</h4>
                  <p>{neighborhoodData.subway_access}</p>
                </div>
                <div className={styles.neighborhoodItem}>
                  <h4>🍽️ Dining Options</h4>
                  <p>{neighborhoodData.dining_options}</p>
                </div>
                <div className={styles.neighborhoodItem}>
                  <h4>🛍️ Shopping</h4>
                  <p>{neighborhoodData.shopping_access}</p>
                </div>
                <div className={styles.neighborhoodItem}>
                  <h4>🛣️ Highway Access</h4>
                  <p>{neighborhoodData.highway_access}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Section */}
      {showContact && (
        <div className={styles.section}>
          <div className={styles.collapsibleHeader} onClick={() => toggleSection('contact')}>
            <h2 className={styles.propertyTitle}>Contact Information</h2>
            <button className={styles.collapseToggleBtn} aria-expanded={openSections.contact} aria-controls="section-contact">
              {openSections.contact ? 'Hide' : 'Show'} <span aria-hidden="true">{openSections.contact ? '▴' : '▾'}</span>
            </button>
          </div>
          <div id="section-contact" className={!openSections.contact ? styles.collapsedContent : styles.sectionBodyFade}>
            <div className={styles.contactSection}>
              <div className={styles.contactButtons}>
                <button className={styles.primaryButton}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  Call Agent
                </button>
                <button className={styles.secondaryButton}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Message
                </button>
              </div>
              <div className={styles.contactInfo}>
                <p><strong>Ubika Real Estate</strong></p>
                <p>📧 info@ubika.com</p>
                <p>📞 +1 (555) 123-4567</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Action Bar */}
  {/* Mobile action bar favorite feature removed */}
    </div>
  );
};

export default PropertyDetailCard;
