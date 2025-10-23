'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Property, PropertyImage } from '../../../types';
import PropertyImageEditor from '../../../ui/PropertyImageEditor';
import { StandardLayout } from '../../../ui';
import styles from '../../../styles/ImageManager.module.css';
import { FilterOptions } from '../../../ui/MapFilters';
import Head from 'next/head';

const ImageManager: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertyImages, setPropertyImages] = useState<PropertyImage[]>([]);
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
      console.error('Error loading images:', error);
      setPropertyImages([]);
    }
  };

  return (
    <StandardLayout
      onFilterChange={handleFilterChange}
      onSearchLocationChange={handleSearchLocationChange}
    >
      <div className={styles.imageManagerContainer}>
        <Head>
          <title>Manage Property Images - Ubika</title>
        </Head>
        
        <div className={styles.sidebar}>
          <h2>Your Properties</h2>
          {loading && <p>Loading properties...</p>}
          {error && <p className={styles.error}>{error}</p>}
          <ul>
            {properties.map(prop => (
              <li 
                key={prop.id} 
                className={selectedProperty?.id === prop.id ? styles.selected : ''}
                onClick={() => handlePropertySelect(prop)}
              >
                {prop.title || `Property ID: ${prop.id}`}
              </li>
            ))}
          </ul>
        </div>
        
        <div className={styles.mainContent}>
          {selectedProperty ? (
            <PropertyImageEditor 
              propertyId={selectedProperty.id}
              initialImages={propertyImages}
              onImagesUpdated={loadPropertyImages}
            />
          ) : (
            <div className={styles.placeholder}>
              <h2>Select a property to manage its images</h2>
              <p>Choose a property from the list on the left to begin editing.</p>
            </div>
          )}
        </div>
      </div>
    </StandardLayout>
  );
};

export default ImageManager;
