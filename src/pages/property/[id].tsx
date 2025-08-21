import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Header from '../../components/Header';
import PropertyGallery from '../../components/PropertyGallery';
import PropertyDetailCard from '../../components/PropertyDetailCard';
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
        <Header />
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
        <Header />
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
        <Header />
        
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

          {/* Property Detail Card - Shows all database information */}
          <PropertyDetailCard property={property} />
        </main>
      </div>
    </>
  );
};

export default PropertyDetail;
