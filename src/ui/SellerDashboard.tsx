'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../styles/Seller.module.css';
import standardStyles from '../styles/StandardComponents.module.css';
import { Property, PropertyType, PropertyStatus, PropertyFeature, PropertyOperationStatus } from '../types';

// Use shared types from `../types` (avoid redeclaring interfaces)

interface SellerDashboardClientProps {
    initialSellerProperties: Property[];
    propertyTypes: PropertyType[];
    propertyStatuses: PropertyStatus[];
    features: PropertyFeature[];
    propertyOperationStatuses: PropertyOperationStatus[];
}

const SellerDashboardClient: React.FC<SellerDashboardClientProps> = ({
    initialSellerProperties,
    propertyTypes,
    propertyStatuses,
    features,
    propertyOperationStatuses,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [sellerProperties] = useState<Property[]>(initialSellerProperties);
  const [error, setError] = useState<string | null>(null);

  const groupedFeatures = useMemo(() => {
    return features.reduce((acc, feature) => {
      const category = feature.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(feature);
      return acc;
    }, {} as Record<string, PropertyFeature[]>);
  }, [features]);

  // Helper function to enrich properties with status data
  const getPropertyStatus = (property: any): PropertyStatus | undefined => {
    // If property already has full status object, return it
    if (property.property_status && typeof property.property_status === 'object' && property.property_status.color) {
      return property.property_status;
    }
    // Otherwise, look up by status ID from propertyStatuses array
    const statusId = property.property_status_id || property.status_id;
    if (statusId) {
      return propertyStatuses.find(s => s.id === statusId);
    }
    // Fallback to first available status
    return propertyStatuses[0];
  };

  if (!session) {
    return (
      <div className={standardStyles.container}>
        <p>Please sign in to manage your properties.</p>
        <button onClick={() => router.push('/api/auth/signin')} className={standardStyles.button}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <h1>My Properties</h1>
      <button onClick={() => router.push('/api/auth/login')} className={`${standardStyles.button} ${styles.addNewButton}`}>
        + Add New Properties
      </button>

      {error && <p className={standardStyles.errorMessage}>{error}</p>}

      <div className={styles.propertyList}>
        {sellerProperties.map(property => {
          const status = getPropertyStatus(property);
          return (
            <div key={property.id} className={styles.propertyCard}>
              <div className={styles.propertyInfo}>
                <h3>{property.title}</h3>
                <p>{property.address}, {property.city}</p>
                <p>Status: <span style={{ color: status?.color || '#000000' }}>{status?.display_name || 'N/A'}</span></p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SellerDashboardClient;
