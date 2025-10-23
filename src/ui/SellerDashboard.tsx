'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../styles/Seller.module.css';
import standardStyles from '../styles/StandardComponents.module.css';
import { Property, PropertyFormData, PropertyImage, PropertyType, PropertyStatus, PropertyFeature, PropertyOperationStatus } from '../types';
import PropertyImageEditor from './PropertyImageEditor';
import { FilterOptions } from './MapFilters';

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
  const [sellerProperties, setSellerProperties] = useState<Property[]>(initialSellerProperties);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProperty, setCurrentProperty] = useState<PropertyFormData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize with a minimal FilterOptions-shaped object used by MapFilters
  const [filterOptions, setFilterOptions] = useState<any>({
    operation: '',
    priceMin: '',
    priceMax: '',
    beds: '',
    baths: '',
    homeType: '',
    moreFilters: {
      minArea: '',
      maxArea: '',
      yearBuiltMin: '',
      yearBuiltMax: '',
      keywords: []
    }
  });
  const formRef = useRef<HTMLFormElement>(null);

  const fetchSellerProperties = useCallback(async () => {
    if (session) {
      try {
        const response = await fetch('/api/properties/seller');
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        const data: Property[] = await response.json();
        setSellerProperties(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    }
  }, [session]);

  const handleEdit = (property: Property) => {
    const selectedFeatures = property.features ? property.features.map(f => f.id) : [];
    const propertyData: PropertyFormData = {
      ...property,
      property_type_id: property.property_type.id,
      property_status_id: property.property_status.id,
      features: selectedFeatures,
      images: property.images || [],
    };
    setCurrentProperty(propertyData);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        const response = await fetch(`/api/properties/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete property');
        }
        await fetchSellerProperties();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    }
  };

  const handleAddNew = () => {
    setCurrentProperty({
      id: 0,
      title: '',
      description: '',
      address: '',
      city: '',
      price: 0,
      bedrooms: 0,
      bathrooms: 0,
      sq_meters: 0,
      lat: 0,
      lng: 0,
      property_type_id: 1,
      property_status_id: 1,
      features: [],
      images: [],
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentProperty(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentProperty) return;

    setIsSubmitting(true);
    setError(null);

    const url = isEditing ? '/api/properties/update' : '/api/properties/create';
    const method = 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentProperty),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} property`);
      }

      await fetchSellerProperties();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!currentProperty) return;
    const { name, value } = event.target;
    setCurrentProperty({ ...currentProperty, [name]: value });
  };

  const handleFeatureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentProperty) return;
    const featureId = parseInt(event.target.value, 10);
    const isChecked = event.target.checked;
    const currentFeatures = currentProperty.features || [];

    if (isChecked) {
      setCurrentProperty({ ...currentProperty, features: [...currentFeatures, featureId] });
    } else {
      setCurrentProperty({ ...currentProperty, features: currentFeatures.filter(id => id !== featureId) });
    }
  };

  const handleImagesChange = (propertyId: number | string) => {
    // after images are updated, re-fetch property images for currentProperty
    if (currentProperty && String(currentProperty.id) === String(propertyId)) {
      // fetch latest images for this property and set in currentProperty
      fetch(`/api/properties/${propertyId}/images`).then(r => r.ok && r.json()).then((imgs: PropertyImage[]) => {
        setCurrentProperty(prev => prev ? { ...prev, images: imgs } : prev);
      }).catch(() => {});
    }
  };

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
      <button onClick={handleAddNew} className={`${standardStyles.button} ${styles.addNewButton}`}>
        + Add New Property
      </button>

      {error && <p className={standardStyles.errorMessage}>{error}</p>}

      <div className={styles.propertyList}>
        {sellerProperties.map(property => (
          <div key={property.id} className={styles.propertyCard}>
            <div className={styles.propertyInfo}>
              <h3>{property.title}</h3>
              <p>{property.address}, {property.city}</p>
              <p>Status: <span style={{ color: property.property_status.color }}>{property.property_status.display_name}</span></p>
            </div>
            <div className={styles.propertyActions}>
              <button onClick={() => handleEdit(property)} className={standardStyles.button}>Edit</button>
              <button onClick={() => handleDelete(property.id)} className={`${standardStyles.button} ${standardStyles.deleteButton}`}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && currentProperty && (
        <div className={standardStyles.modalBackdrop}>
          <div className={standardStyles.modalContent} style={{ maxWidth: '800px' }}>
            <form onSubmit={handleSubmit} ref={formRef}>
              <h2>{isEditing ? 'Edit Property' : 'Add New Property'}</h2>
              
              <div className={styles.formGrid}>
                <div className={styles.formColumn}>
                  <label>Title: <input type="text" name="title" value={currentProperty.title} onChange={handleInputChange} required /></label>
                  <label>Description: <textarea name="description" value={currentProperty.description} onChange={handleInputChange} required /></label>
                  <label>Address: <input type="text" name="address" value={currentProperty.address} onChange={handleInputChange} required /></label>
                  <label>City: <input type="text" name="city" value={currentProperty.city} onChange={handleInputChange} required /></label>
                  <label>Price: <input type="number" name="price" value={currentProperty.price} onChange={handleInputChange} required /></label>
                  <label>Bedrooms: <input type="number" name="bedrooms" value={currentProperty.bedrooms} onChange={handleInputChange} required /></label>
                  <label>Bathrooms: <input type="number" name="bathrooms" value={currentProperty.bathrooms} onChange={handleInputChange} required /></label>
                  <label>Sq. Meters: <input type="number" name="sq_meters" value={currentProperty.sq_meters} onChange={handleInputChange} required /></label>
                  <label>Latitude: <input type="number" name="lat" value={currentProperty.lat} onChange={handleInputChange} step="any" required /></label>
                  <label>Longitude: <input type="number" name="lng" value={currentProperty.lng} onChange={handleInputChange} step="any" required /></label>
                  
                  <label>Property Type:
                    <select name="property_type_id" value={currentProperty.property_type_id} onChange={handleInputChange}>
                      {propertyTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.display_name}</option>)}
                    </select>
                  </label>
                  
                  <label>Property Status:
                    <select name="property_status_id" value={currentProperty.property_status_id} onChange={handleInputChange}>
                      {propertyStatuses.map(ps => <option key={ps.id} value={ps.id}>{ps.display_name}</option>)}
                    </select>
                  </label>
                </div>

                <div className={styles.formColumn}>
                  <h4>Features</h4>
                  <div className={styles.featuresGrid}>
                    {Object.entries(groupedFeatures).map(([category, featuresInCategory]) => (
                      <div key={category} className={styles.featureCategory}>
                        <h5>{category}</h5>
                        {featuresInCategory.map(feature => (
                          <label key={feature.id} className={styles.featureLabel}>
                            <input
                              type="checkbox"
                              value={feature.id}
                              checked={currentProperty.features.includes(feature.id)}
                              onChange={handleFeatureChange}
                            /> {feature.name}
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <h4>Images</h4>
              <PropertyImageEditor
                propertyId={currentProperty.id}
                initialImages={currentProperty.images}
                onImagesUpdated={handleImagesChange}
              />

              <div className={standardStyles.modalActions}>
                <button type="submit" className={standardStyles.button} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className={standardStyles.button} onClick={handleCloseModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboardClient;
