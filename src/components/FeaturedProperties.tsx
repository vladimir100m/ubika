import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import PropertyCard from './PropertyCard';
import { Property } from '../types';
// Favorite/save feature removed
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
  // Saved property IDs removed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
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

        const response = await fetch(`/api/properties?${queryParams.toString()}`, { signal: controller.signal });
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
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // fetch aborted - ignore
          return;
        }
        console.error('Error fetching properties:', error);
        setError('Unable to load properties. Please try again later.');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
    return () => controller.abort();
  }, [limit, operation]);

  // Saved status effect removed

  // Favorite toggle removed

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