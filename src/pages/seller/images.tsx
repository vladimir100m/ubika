import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { Property, PropertyImage } from '../../types';
import PropertyImageEditor from '../../components/PropertyImageEditor';
import Header from '../../components/Header';
import styles from '../../styles/ImageManager.module.css';

const ImageManager: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertyImages, setPropertyImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    loadSellerProperties();
  }, [session, status, router]);

  const loadSellerProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/properties/seller');
      
      if (!response.ok) {
        throw new Error('Failed to load properties');
      }

      const data = await response.json();
      setProperties(data.properties || []);
      
      // If there's only one property, select it automatically
      if (data.properties && data.properties.length === 1) {
        handlePropertySelect(data.properties[0]);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      setError(error instanceof Error ? error.message : 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySelect = async (property: Property) => {
    setSelectedProperty(property);
    await loadPropertyImages(property.id);
  };

  const loadPropertyImages = async (propertyId: string | number) => {
    try {
      const response = await fetch(`/api/properties/images/${propertyId}`);
      
      if (response.ok) {
        const result = await response.json();
        setPropertyImages(result.images || []);
      } else {
        console.error('Failed to load property images');
        setPropertyImages([]);
      }
    } catch (error) {
      console.error('Error loading property images:', error);
      setPropertyImages([]);
    }
  };

  const handleImagesChange = (images: PropertyImage[]) => {
    setPropertyImages(images);
    
    // Update the property in the properties list to reflect new image count
    if (selectedProperty) {
      setProperties(prev => prev.map(prop => 
        prop.id === selectedProperty.id 
          ? { ...prop, images }
          : prop
      ));
    }
  };

  if (status === 'loading' || loading) {
    return (
      <>
        <Head>
          <title>Image Manager - Ubika</title>
        </Head>
        <Header />
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading your properties...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Image Manager - Ubika</title>
        </Head>
        <Header />
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>Error Loading Properties</h2>
            <p>{error}</p>
            <button onClick={loadSellerProperties} className={styles.retryBtn}>
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!session) {
    return null; // Will redirect to signin
  }

  return (
    <>
      <Head>
        <title>Image Manager - Ubika</title>
        <meta name="description" content="Manage your property images" />
      </Head>
      <Header />
      
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.pageSection}>
          <h1 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🖼️</span>
            Image Manager
          </h1>
          <p className={styles.sectionDescription}>
            Manage images for your properties with advanced editing tools
          </p>
        </div>

        {properties.length === 0 ? (
          <div className={styles.pageSection}>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🏠</div>
              <h2>No Properties Found</h2>
              <p>You need to create a property first before managing images.</p>
              <button
                onClick={() => router.push('/seller')}
                className={styles.createBtn}
              >
                Create Your First Property
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.layout}>
            {/* Property Selector Section */}
            <div className={styles.sidebar}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🏠</span>
                Your Properties
              </h3>
              <p className={styles.sectionDescription}>
                Select a property to manage its images
              </p>
              <div className={styles.propertyList}>
                  {properties.map((property) => (
                  <div
                    key={property.id}
                    className={`${styles.propertyCard} ${
                      selectedProperty?.id === property.id ? styles.selected : ''
                    }`}
                    onClick={() => handlePropertySelect(property)}
                  >
                    <div className={styles.propertyInfo}>
                      <h4 className={styles.propertyTitle}>
                        {property.title || `Property ${property.id}`}
                      </h4>
                      <p className={styles.propertyLocation}>
                        {property.city}, {property.state}
                      </p>
                      <div className={styles.propertyMeta}>
                        <span className={styles.metaItem}>
                          📸 {property.images?.length || 0} images
                        </span>
                        <span className={styles.metaItem}>
                          💰 ${property.price?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    {property.images && property.images.length > 0 && (
                      <div className={styles.propertyThumbnail}>
                        <img
                          src={property.images.find(img => img.is_cover)?.image_url || property.images[0]?.image_url}
                          alt={property.title}
                          className={styles.thumbnailImg}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => router.push('/seller')}
                className={styles.manageBtn}
              >
                ⚙️ Manage Properties
              </button>
            </div>

            {/* Image Editor Section */}
            <div className={styles.main}>
              {selectedProperty ? (
                <div className={styles.pageSection}>
                  <h3 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>📷</span>
                    {selectedProperty.title || `Property ${selectedProperty.id}`}
                  </h3>
                  <p className={styles.sectionDescription}>
                    Upload, organize, and manage images for this property
                  </p>
                  <div className={styles.editorMeta}>
                    <span className={styles.metaBadge}>
                      {propertyImages.length} image{propertyImages.length !== 1 ? 's' : ''}
                    </span>
                    {propertyImages.find(img => img.is_cover) && (
                      <span className={styles.coverBadge}>
                        ⭐ Cover set
                      </span>
                    )}
                  </div>

                  <PropertyImageEditor
                    propertyId={selectedProperty.id}
                    sellerId={(session.user as any)?.sub || session.user?.email || 'anonymous'}
                    images={propertyImages}
                    onChange={handleImagesChange}
                    maxImages={20}
                    allowBulkOperations={true}
                    showImagePreview={true}
                  />
                </div>
              ) : (
                <div className={styles.pageSection}>
                  <div className={styles.selectPrompt}>
                    <div className={styles.promptIcon}>👈</div>
                    <h3>Select a Property</h3>
                    <p>Choose a property from the list to manage its images</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ImageManager;
