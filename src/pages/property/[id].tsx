import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { StandardLayout } from '../../components';
import PropertyGallery from '../../components/PropertyGallery';
import PropertyDetailCard from '../../components/PropertyDetailCard';
import { Property } from '../../types';
import { toggleSaveProperty } from '../../utils/savedPropertiesApi';
import styles from '../../styles/PropertyDetail.module.css';
import { FilterOptions } from '../../components/MapFilters';

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

  // Filter handlers - redirect to map page with filters
  const handleFilterChange = (filters: FilterOptions) => {
    const query: any = {};
    if (filters.operation) query.operation = filters.operation;
    if (filters.priceMin) query.minPrice = filters.priceMin;
    if (filters.priceMax) query.maxPrice = filters.priceMax;
    if (filters.beds) query.bedrooms = filters.beds;
    if (filters.baths) query.bathrooms = filters.baths;
    if (filters.homeType) query.propertyType = filters.homeType;
    if (filters.moreFilters.minArea) query.minArea = filters.moreFilters.minArea;
    if (filters.moreFilters.maxArea) query.maxArea = filters.moreFilters.maxArea;
    
    router.push({
      pathname: '/map',
      query
    });
  };

  const handleSearchLocationChange = (location: string) => {
    const query: any = {};
    if (location && location.trim() !== '') {
      query.zone = location;
    }
    router.push({
      pathname: '/map',
      query
    });
  };

  // Fetch property data
  useEffect(() => {
    if (!id) return;

    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/properties/${id}`);
        
        if (!response.ok) {
          throw new Error('Property not found');
        }

        const propertyData = await response.json();
        
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
      <StandardLayout 
        title="Property Details" 
        subtitle="Loading property information..."
        showMapFilters={true}
        onFilterChange={handleFilterChange}
        onSearchLocationChange={handleSearchLocationChange}
        searchLocation=""
        initialFilters={{}}
      >
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading property details...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  if (error || !property) {
    return (
      <StandardLayout 
        title="Property Not Found" 
        subtitle="The property you are looking for does not exist"
        showMapFilters={true}
        onFilterChange={handleFilterChange}
        onSearchLocationChange={handleSearchLocationChange}
        searchLocation=""
        initialFilters={{}}
      >
        <div className={styles.container}>
          <div className={styles.error}>
            <h1>Property Not Found</h1>
            <p>{error || 'The property you are looking for does not exist.'}</p>
            <button onClick={() => router.push('/')} className={styles.backButton}>
              Back to Home
            </button>
          </div>
        </div>
      </StandardLayout>
    );
  }

  // Get all property images or fallback to single image
  const getPropertyImages = (property: Property): string[] => {
    // First check if property has uploaded images
    if (property.images && property.images.length > 0) {
      return property.images
        .sort((a, b) => {
          // Sort by is_cover first, then by display_order
          if (a.is_cover && !b.is_cover) return -1;
          if (!a.is_cover && b.is_cover) return 1;
          return a.display_order - b.display_order;
        })
        .map(img => img.image_url);
    }
    
    // Fallback to single image_url or default
    return property.image_url ? [property.image_url] : ['/properties/casa-moderna.jpg'];
  };

  const images = getPropertyImages(property);
  const coverImage = property.images?.find(img => img.is_cover)?.image_url || property.image_url || images[0];
  const formattedAddress = `${property.address}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''}`;

  return (
    <StandardLayout 
      title={property.title} 
      subtitle={`${property.type || 'Property'} in ${property.city || property.address}`}
      showMapFilters={true}
      onFilterChange={handleFilterChange}
      onSearchLocationChange={handleSearchLocationChange}
      searchLocation=""
      initialFilters={{}}
    >
      <Head>
        <title>{property.title} - Ubika</title>
        <meta name="description" content={property.description || `${property.type} in ${property.city}`} />
      </Head>

      <div className={styles.container}>
        
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
    </StandardLayout>
  );
};

export default PropertyDetail;
