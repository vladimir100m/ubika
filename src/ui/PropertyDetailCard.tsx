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

  return (
    <div className={styles.propertyDetailCard}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.priceSection}>
          <div className={styles.price}>
            {formatPropertyPriceCompact(property.price)}
            {property.operation_status_id === 2 && <span className={styles.period}>/month</span>}
          </div>
          {property.property_status && (
            <div className={`${styles.statusBadge} ${styles[property.property_status.display_name?.toLowerCase() || '']}`}>
              {property.property_status.display_name}
            </div>
          )}
        </div>
        
        <h1 className={styles.title}>
          {property.title || `${property.property_type?.display_name || 'Property'} in ${property.city}`}
        </h1>
        
        <div className={styles.location}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>{property.address}, {property.city}, {property.state}, {property.country}</span>
        </div>
      </div>

      {/* Actions */}
      <PropertyActions 
        propertyId={property.id}
      />

      {/* Main Details */}
      <div className={styles.mainDetails}>
        <div className={styles.keyDetails}>
          <div className={styles.detailItem}>
            <div className={styles.detailIcon}>🛏️</div>
            <div>
              <div className={styles.detailValue}>{property.bedrooms}</div>
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
              <div className={styles.detailValue}>{property.sq_meters}</div>
              <div className={styles.detailLabel}>m²</div>
            </div>
          </div>
          
          <div className={styles.detailItem}>
            <div className={styles.detailIcon}>🏠</div>
            <div>
              <div className={styles.detailValue}>{property.property_type?.display_name || 'N/A'}</div>
              <div className={styles.detailLabel}>Property Type</div>
            </div>
          </div>
        </div>
      </div>

      {/* What's Special - Highlight Key Features (Zillow style) */}
      {property.features && property.features.length > 0 && (
        <div className={styles.section}>
          <div className={styles.specialHighlightsHeader}>
            <h2 className={styles.propertyTitle}>What's Special</h2>
          </div>
          <div className={styles.specialHighlights}>
            {property.features.slice(0, 7).map((feature) => (
              <div key={feature.id} className={styles.highlightBullet}>
                • {feature.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {property.description && (
        <div className={styles.section}>
          <div className={`${styles.collapsibleHeader}`}>
            <h2 className={styles.propertyTitle}>About This Property</h2>
          </div>
          <div id="section-description" className={styles.sectionBodyFade}>
            <p className={styles.description}>{property.description}</p>
          </div>
        </div>
      )}

      {/* Property Information */}
      <div className={styles.section}>
        <div className={styles.collapsibleHeader}>
          <h2 className={styles.propertyTitle}>Facts & Features</h2>
        </div>
        <div id="section-info" className={`${styles.sectionBodyFade} ${styles.propertyInfo}`}>
          {/* Interior Section */}
          <div className={styles.factsCategory}>
            <h3 className={styles.categoryTitle}>Interior</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Bedrooms</span>
                <span className={styles.infoValue}>{property.bedrooms}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Bathrooms</span>
                <span className={styles.infoValue}>{property.bathrooms}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Square Meters</span>
                <span className={styles.infoValue}>{property.sq_meters}</span>
              </div>
              {property.year_built && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Year Built</span>
                  <span className={styles.infoValue}>{property.year_built}</span>
                </div>
              )}
            </div>
          </div>

          {/* Property Section */}
          <div className={styles.factsCategory}>
            <h3 className={styles.categoryTitle}>Property</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Property Type</span>
                <span className={styles.infoValue}>{property.property_type?.display_name || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Status</span>
                <span className={styles.infoValue}>{property.property_status?.display_name || 'N/A'}</span>
              </div>
              {property.zip_code && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>ZIP Code</span>
                  <span className={styles.infoValue}>{property.zip_code}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Property ID</span>
                <span className={styles.infoValue}>{property.id}</span>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className={styles.factsCategory}>
            <h3 className={styles.categoryTitle}>Location</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Address</span>
                <span className={styles.infoValue}>{property.address}, {property.city}, {property.state}</span>
              </div>
              {property.lat !== undefined && property.lng !== undefined && (
                <>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Latitude</span>
                    <span className={styles.infoValue}>{property.lat.toFixed(6)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Longitude</span>
                    <span className={styles.infoValue}>{property.lng.toFixed(6)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Listing Details Section */}
          <div className={styles.factsCategory}>
            <h3 className={styles.categoryTitle}>Listing Details</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Listed Date</span>
                <span className={styles.infoValue}>{formatPropertyDate(property.created_at)}</span>
              </div>
              {property.updated_at !== property.created_at && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Last Updated</span>
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

      {/* Property Features */}
      {property.features && property.features.length > 0 && (
        <div className={styles.section}>
          <div className={styles.collapsibleHeader}>
            <h2 className={styles.propertyTitle}>All Features ({property.features.length})</h2>
          </div>
          <div id="section-features" className={styles.sectionBodyFade}>
            <div className={styles.featuresContainer}>
              {Object.entries(
                property.features.reduce((acc, feature) => {
                  const category = feature.category || 'Other';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(feature);
                  return acc;
                }, {} as Record<string, any[]>)
              ).map(([category, features]) => (
                <div key={category} className={styles.featureCategory}>
                  <h4 className={styles.featureCategoryTitle}>{category}</h4>
                  <div className={styles.featuresList}>
                    {features.map((feature) => (
                      <div key={feature.id} className={styles.featureItemBullet}>
                        • {feature.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Neighborhood Information */}
      {neighborhoodData && (
        <div className={styles.section}>
          <div className={styles.collapsibleHeader}>
            <h2 className={styles.propertyTitle}>Neighborhood: {neighborhoodData.name}</h2>
          </div>
          <div id="section-neighborhood" className={styles.sectionBodyFade}>
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

      {/* HOA & Amenities Section */}
      <div className={styles.section}>
        <div className={styles.collapsibleHeader}>
          <h2 className={styles.propertyTitle}>Community & HOA</h2>
        </div>
        <div id="section-hoa" className={styles.sectionBodyFade}>
          <div className={styles.hoaGrid}>
            <div className={styles.hoaItem}>
              <h4>🏘️ Amenities</h4>
              <ul className={styles.amenitiesList}>
                <li>• Parking included</li>
                <li>• Fitness center</li>
                <li>• Community room</li>
                <li>• Guest suites</li>
              </ul>
            </div>
            <div className={styles.hoaItem}>
              <h4>📋 Services</h4>
              <ul className={styles.servicesList}>
                <li>• Building insurance included</li>
                <li>• Common elements maintained</li>
                <li>• 24/7 security</li>
                <li>• Visitor parking available</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Financial & Listing Details Section */}
      <div className={styles.section}>
        <div className={styles.collapsibleHeader}>
          <h2 className={styles.propertyTitle}>Financial & Listing Details</h2>
        </div>
        <div id="section-financial" className={styles.sectionBodyFade}>
          <div className={styles.financialGrid}>
            <div className={styles.financialItem}>
              <span className={styles.financialLabel}>HOA Fee</span>
              <span className={styles.financialValue}>$1,304/month</span>
            </div>
            <div className={styles.financialItem}>
              <span className={styles.financialLabel}>Annual Tax</span>
              <span className={styles.financialValue}>$3,460</span>
            </div>
            <div className={styles.financialItem}>
              <span className={styles.financialLabel}>Days on Market</span>
              <span className={styles.financialValue}>51</span>
            </div>
            <div className={styles.financialItem}>
              <span className={styles.financialLabel}>Property Views</span>
              <span className={styles.financialValue}>136</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      {showContact && (
        <div className={styles.section}>
          <div className={styles.collapsibleHeader}>
            <h2 className={styles.propertyTitle}>Contact an Agent</h2>
          </div>
          <div id="section-contact" className={styles.sectionBodyFade}>
            <div className={styles.contactSection}>
              <p className={styles.contactDescription}>
                Get more information about this property, schedule a viewing, or ask any questions.
              </p>
              <form className={styles.contactForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Name *</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email *</label>
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Message</label>
                  <textarea
                    placeholder="I'm interested in this property..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    className={styles.formTextarea}
                    rows={4}
                  />
                </div>
                <div className={styles.formActions}>
                  <button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={submitStatus === 'loading'}
                  >
                    {submitStatus === 'loading' ? 'Sending...' : 'Send Message'}
                  </button>
                  <div className={styles.contactInfo}>
                    <p><strong>Ubika Real Estate</strong></p>
                    <p>📧 info@ubika.com | 📞 +1 (555) 123-4567</p>
                  </div>
                </div>
                {submitStatus === 'success' && (
                  <div className={styles.successMessage}>✅ Message sent successfully!</div>
                )}
                {submitStatus === 'error' && (
                  <div className={styles.errorMessage}>❌ Error sending message. Please try again.</div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailCard;
