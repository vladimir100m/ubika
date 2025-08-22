import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import PropertyCard from './PropertyCard';
import { Property } from '../types';
import { checkSavedStatus, toggleSaveProperty } from '../utils/savedPropertiesApi';
import styles from '../styles/Home.module.css';

interface FeaturedPropertiesProps {
  limit?: number;
  title?: string;
  operation?: 'buy' | 'rent';
}

const FeaturedProperties: React.FC<FeaturedPropertiesProps> = ({ 
  limit = 6, 
  title = "Featured Properties",
  operation 
}) => {
  const { data: session } = useSession();
  const user = session?.user;
  const [properties, setProperties] = useState<Property[]>([]);
  const [savedPropertyIds, setSavedPropertyIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('limit', limit.toString());
        if (operation) {
          queryParams.append('operation', operation);
        }

        const response = await fetch(`/api/properties?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error(`Error fetching properties: ${response.statusText}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setProperties(data);
        } else {
          console.error('Error fetching properties: Data is not an array', data);
          setError('Unable to load properties. Please try again later.');
          setProperties([]);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('Unable to load properties. Please try again later.');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [limit, operation]);

  useEffect(() => {
    const fetchSavedStatus = async () => {
      if (user && properties.length > 0) {
        try {
          const savedStatus = await checkSavedStatus(properties.map(p => p.id));
          setSavedPropertyIds(new Set(Object.keys(savedStatus).map(id => parseInt(id)).filter(id => savedStatus[id])));
        } catch (error) {
          console.error('Error fetching saved status:', error);
        }
      }
    };

    fetchSavedStatus();
  }, [user, properties]);

  const handleFavoriteToggle = async (propertyId: number, newStatus?: boolean) => {
    if (!user) {
      return; // Don't redirect here, just disable the functionality
    }

    try {
      const isCurrentlySaved = newStatus !== undefined ? !newStatus : savedPropertyIds.has(propertyId);
      await toggleSaveProperty(propertyId, !isCurrentlySaved);
      
      // Update local state
      setSavedPropertyIds(prevSavedIds => {
        const newSavedIds = new Set(prevSavedIds);
        if (isCurrentlySaved) {
          newSavedIds.delete(propertyId);
        } else {
          newSavedIds.add(propertyId);
        }
        return newSavedIds;
      });
    } catch (error) {
      console.error('Error toggling favorite status:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.propertySection}>
        <div className={styles.propertyHeader}>
          <h2 className={styles.propertyTitle}>{title}</h2>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.propertySection}>
        <div className={styles.propertyHeader}>
          <h2 className={styles.propertyTitle}>{title}</h2>
        </div>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.propertySection}>
      <div className={styles.propertyHeader}>
        <h2 className={styles.propertyTitle}>{title}</h2>
      </div>
      {properties.length > 0 ? (
        <div className={styles.propertyGrid}>
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isFavorite={savedPropertyIds.has(property.id)}
              onFavoriteToggle={() => handleFavoriteToggle(property.id)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h3>No properties found</h3>
          <p>We couldn't find any featured properties at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default FeaturedProperties;