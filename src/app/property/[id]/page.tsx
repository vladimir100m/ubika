'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { StandardLayout } from '../../../ui';
import PropertyGallery from '../../../ui/PropertyGallery';
import PropertyDetailCard from '../../../ui/PropertyDetailCard';
import { Property } from '../../../types';
import styles from '../../../styles/PropertyDetail.module.css';
import { FilterOptions } from '../../../ui/MapFilters';
import { useRouter } from 'next/navigation';

const PropertyDetail: React.FC<{ params: { id: string } }> = ({ params }) => {
  const { id } = params;
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    
    const newParams = new URLSearchParams(query).toString();
    router.push(`/map?${newParams}`);
  };

  const handleSearchLocationChange = (location: string) => {
    const query: any = {};
    if (location && location.trim() !== '') {
      query.zone = location;
    }
    const newParams = new URLSearchParams(query).toString();
    router.push(`/map?${newParams}`);
  };

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load property');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, user]);

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
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  if (loading) {
    return <StandardLayout><div className={styles.centeredMessage}>Loading...</div></StandardLayout>;
  }

  if (error) {
    return <StandardLayout><div className={styles.centeredMessage}>{error}</div></StandardLayout>;
  }

  if (!property) {
    return <StandardLayout><div className={styles.centeredMessage}>Property not found.</div></StandardLayout>;
  }

  return (
    <StandardLayout
      onFilterChange={handleFilterChange}
      onSearchLocationChange={handleSearchLocationChange}
    >
      <div className={styles.detailContainer}>
        <PropertyGallery property={property} />
        <PropertyDetailCard 
          property={property} 
        />
      </div>
    </StandardLayout>
  );
};

export default PropertyDetail;
