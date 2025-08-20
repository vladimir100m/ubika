import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Header from '../../components/Header';
import PropertyGallery from '../../components/PropertyGallery';
import { Property } from '../../types';
import { toggleSaveProperty } from '../../utils/savedPropertiesApi';
import styles from '../../styles/PropertyDetail.module.css';

const PropertyDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const user = session?.user;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<'buy' | 'rent'>('buy');

  // Fetch property data
  useEffect(() => {
    if (!id) return;

    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/properties?id=${id}`);
        
        if (!response.ok) {
          throw new Error('Property not found');
        }

        const data = await response.json();
        const propertyData = Array.isArray(data) ? data[0] : data;
        
        if (!propertyData) {
          throw new Error('Property not found');
        }

        setProperty(propertyData);

        // Check if property is saved
        if (user) {
          const savedResponse = await fetch(`/api/properties/saved-status?propertyId=${id}`);
          if (savedResponse.ok) {
            const savedData = await savedResponse.json();
            setIsFavorite(savedData.isSaved);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load property');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, user]);

  const handleSaveProperty = async () => {
    if (!user || !property) {
      router.push('/auth/signin');
      return;
    }

    if (saving) return;

    setSaving(true);
    try {
      await toggleSaveProperty(property.id, isFavorite);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error saving property:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title || 'Property on Ubika',
          text: property?.description || 'Check out this property',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Header selectedOperation={selectedOperation} onOperationChange={setSelectedOperation} />
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className={styles.container}>
        <Header selectedOperation={selectedOperation} onOperationChange={setSelectedOperation} />
        <div className={styles.error}>
          <h1>Property Not Found</h1>
          <p>{error || 'The property you are looking for does not exist.'}</p>
          <button onClick={() => router.push('/')} className={styles.backButton}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const images = property.image_url ? [property.image_url] : [];
  const formattedAddress = `${property.address}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''}`;

  return (
    <>
      <Head>
        <title>{property.title || `Property in ${property.city}`} | Ubika</title>
        <meta name="description" content={property.description} />
        <meta property="og:title" content={property.title || `Property in ${property.city}`} />
        <meta property="og:description" content={property.description} />
        <meta property="og:image" content={property.image_url} />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_BASE_URL}/property/${property.id}`} />
      </Head>

      <div className={styles.container}>
        <Header selectedOperation={selectedOperation} onOperationChange={setSelectedOperation} />
        
        <main className={styles.main}>
          {/* Property Images */}
          <section className={styles.imageSection}>
            {images.length > 0 ? (
              <PropertyGallery images={images} initialIndex={0} />
            ) : (
              <div className={styles.placeholderImage}>
                <img src="/properties/casa-moderna.jpg" alt="Property" />
              </div>
            )}
          </section>

          {/* Property Content */}
          <div className={styles.content}>
            {/* Property Header */}
            <section className={styles.propertyHeader}>
              <div className={styles.headerContent}>
                <div className={styles.propertyInfo}>
                  <h1 className={styles.title}>{property.title || `Property in ${property.city}`}</h1>
                  <p className={styles.address}>{formattedAddress}</p>
                  <div className={styles.price}>{property.price}</div>
                </div>
                
                <div className={styles.actions}>
                  <button 
                    onClick={handleSaveProperty}
                    disabled={saving}
                    className={`${styles.saveButton} ${isFavorite ? styles.saved : ''}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? '#ff4757' : 'none'} stroke={isFavorite ? '#ff4757' : 'currentColor'} strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {saving ? 'Saving...' : (isFavorite ? 'Saved' : 'Save')}
                  </button>
                  
                  <button onClick={handleShare} className={styles.shareButton}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3"/>
                      <circle cx="6" cy="12" r="3"/>
                      <circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    Share
                  </button>
                </div>
              </div>

              {/* Property Specs */}
              <div className={styles.specs}>
                {property.rooms && (
                  <div className={styles.spec}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
                      <polyline points="9,22 9,12 15,12 15,22"/>
                    </svg>
                    <span>{property.rooms} bedroom{property.rooms !== 1 ? 's' : ''}</span>
                  </div>
                )}
                
                {property.bathrooms && (
                  <div className={styles.spec}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 6a3 3 0 1 1 6 0"/>
                      <path d="M12 9v3"/>
                      <path d="M8 15h8"/>
                      <path d="M8 19h8"/>
                    </svg>
                    <span>{property.bathrooms} bathroom{property.bathrooms !== 1 ? 's' : ''}</span>
                  </div>
                )}
                
                {property.squareMeters && (
                  <div className={styles.spec}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <path d="M9 9h6v6H9z"/>
                    </svg>
                    <span>{property.squareMeters} m²</span>
                  </div>
                )}

                {property.yearBuilt && (
                  <div className={styles.spec}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>Built in {property.yearBuilt}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Property Description */}
            <section className={styles.description}>
              <h2>About This Property</h2>
              <p>{property.description}</p>
            </section>

            {/* Property Details Grid */}
            <section className={styles.detailsSection}>
              <h2>Property Details</h2>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Property Type</span>
                  <span className={styles.detailValue}>{property.type || 'Not specified'}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Status</span>
                  <span className={styles.detailValue}>{property.operation_status_display || property.status || 'Available'}</span>
                </div>
                
                {property.yearBuilt && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Year Built</span>
                    <span className={styles.detailValue}>{property.yearBuilt}</span>
                  </div>
                )}
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Area</span>
                  <span className={styles.detailValue}>{property.squareMeters} m²</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Bedrooms</span>
                  <span className={styles.detailValue}>{property.rooms}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Bathrooms</span>
                  <span className={styles.detailValue}>{property.bathrooms}</span>
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section className={styles.contactSection}>
              <div className={styles.contactCard}>
                <h2>Interested in this property?</h2>
                <p>Contact us for more information or to schedule a viewing.</p>
                
                <div className={styles.contactActions}>
                  <button className={styles.primaryButton}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    Call Now
                  </button>
                  
                  <button className={styles.secondaryButton}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Send Message
                  </button>
                  
                  <button className={styles.secondaryButton}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Schedule Tour
                  </button>
                </div>
              </div>
            </section>

            {/* Map Section (placeholder for future implementation) */}
            <section className={styles.mapSection}>
              <h2>Location</h2>
              <div className={styles.mapPlaceholder}>
                <p>Map view coming soon</p>
                <p className={styles.locationText}>{formattedAddress}</p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default PropertyDetail;
