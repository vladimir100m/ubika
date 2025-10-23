'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../styles/Seller.module.css';
import standardStyles from '../styles/StandardComponents.module.css';
import { Property, PropertyFormData, PropertyType, PropertyStatus, PropertyFeature } from '../types';
import PropertyCard from './PropertyCard';

interface SellerViewProps {
  userId: string;
}

interface ModalState {
  isOpen: boolean;
  type: 'view' | 'edit' | null;
  property: Property | null;
}

export default function SellerView({ userId }: SellerViewProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [sellerProperties, setSellerProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, property: null });
  const [editFormData, setEditFormData] = useState<PropertyFormData | null>(null);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [propertyStatuses, setPropertyStatuses] = useState<PropertyStatus[]>([]);
  const [propertyFeatures, setPropertyFeatures] = useState<PropertyFeature[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editMessage, setEditMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load properties and metadata
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch seller properties
        const propsResponse = await fetch(`/api/properties/seller?seller_id=${userId}`);
        if (!propsResponse.ok) throw new Error('Failed to fetch properties');
        const propsData = await propsResponse.json();
        setSellerProperties(propsData);

        // Fetch property types
        const typesResponse = await fetch('/api/property-types');
        if (typesResponse.ok) {
          const typesData = await typesResponse.json();
          setPropertyTypes(typesData);
        }

        // Fetch property statuses
        const statusesResponse = await fetch('/api/property-statuses');
        if (statusesResponse.ok) {
          const statusesData = await statusesResponse.json();
          setPropertyStatuses(statusesData);
        }

        // Fetch property features
        const featuresResponse = await fetch('/api/property-features');
        if (featuresResponse.ok) {
          const featuresData = await featuresResponse.json();
          setPropertyFeatures(featuresData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Handle opening view modal
  const handleViewProperty = (property: Property) => {
    setModalState({ isOpen: true, type: 'view', property });
  };

  // Handle opening edit modal
  const handleEditProperty = (property: Property) => {
    const formData: PropertyFormData = {
      id: property.id,
      title: property.title,
      description: property.description,
      price: property.price,
      address: property.address,
      city: property.city,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sq_meters: property.sq_meters,
      lat: property.lat,
      lng: property.lng,
      property_type_id: typeof property.property_type === 'object' ? property.property_type.id : 1,
      property_status_id: typeof property.property_status === 'object' ? property.property_status.id : 1,
      features: (property.features || []).map(f => f.id),
      images: property.images || [],
      seller_id: userId,
      state: property.state,
      country: property.country,
      zip_code: property.zip_code
    };
    setEditFormData(formData);
    setModalState({ isOpen: true, type: 'edit', property });
    setEditMessage(null);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setModalState({ isOpen: false, type: null, property: null });
    setEditFormData(null);
    setEditMessage(null);
  };

  // Handle edit form changes
  const handleEditFormChange = (field: keyof PropertyFormData, value: any) => {
    if (editFormData) {
      setEditFormData({ ...editFormData, [field]: value });
    }
  };

  // Handle feature toggle
  const handleFeatureToggle = (featureId: number) => {
    if (editFormData) {
      const newFeatures = editFormData.features.includes(featureId)
        ? editFormData.features.filter(id => id !== featureId)
        : [...editFormData.features, featureId];
      setEditFormData({ ...editFormData, features: newFeatures });
    }
  };

  // Handle saving edited property
  const handleSaveProperty = async () => {
    if (!editFormData) return;

    try {
      setSubmitting(true);
      setEditMessage(null);

      const payload = {
        ...editFormData,
        seller_id: userId
      };

      const response = await fetch(`/api/properties/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update property');
      }

      const updatedProperty = await response.json();
      
      // Update local state
      setSellerProperties(prev =>
        prev.map(p => p.id === updatedProperty.id ? updatedProperty : p)
      );

      setEditMessage({ text: 'Property updated successfully!', type: 'success' });
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err) {
      setEditMessage({
        text: err instanceof Error ? err.message : 'Failed to update property',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className={standardStyles.container}>
        <p>Please sign in to access the seller dashboard.</p>
        <button onClick={() => router.push('/api/auth/signin')} className={standardStyles.button}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Header Section */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>
            Seller Dashboard
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>
            Welcome back! Manage your properties and track your listings.
          </p>

          {/* Quick Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#0073e6', marginBottom: '8px' }}>
                {sellerProperties.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Total Properties
              </div>
            </div>

            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>
                {sellerProperties.filter(p => (p as any).status === 'available').length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Available
              </div>
            </div>

            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b', marginBottom: '8px' }}>
                {sellerProperties.filter(p => (p as any).status === 'pending').length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Pending
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/images')}
              style={{
                backgroundColor: '#0073e6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = '#0059b3';
                (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = '#0073e6';
                (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              📷 Manage Images
            </button>
            <button
              onClick={() => router.push('/profile')}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = '#059669';
                (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = '#10b981';
                (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              ➕ Add New Property
            </button>
          </div>
        </div>

        {/* My Properties Section */}
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: '#1f2937' }}>
            My Properties
          </h2>

          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '18px', marginBottom: '12px' }}>Loading your properties...</div>
            </div>
          ) : sellerProperties.length === 0 ? (
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '60px 20px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '2px dashed #d1d5db'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#4b5563', marginBottom: '12px' }}>
                No Properties Yet
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                Start listing your properties to get started
              </p>
              <button
                onClick={() => router.push('/profile')}
                style={{
                  backgroundColor: '#0073e6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Add Your First Property
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {sellerProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  showFullDetails={false}
                  isSaved={false}
                  onSaveToggle={() => {}}
                  onClick={() => handleViewProperty(property)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {modalState.isOpen && modalState.type === 'view' && modalState.property && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
              position: 'sticky' as any,
              top: 0,
              backgroundColor: 'white'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                Property Details
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                  {modalState.property.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                  📍 {modalState.property.address}, {modalState.property.city}
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px',
                paddingBottom: '20px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>💰 Price</label>
                  <p style={{ fontSize: '18px', fontWeight: '700', color: '#0073e6', margin: '4px 0 0 0' }}>
                    ${modalState.property.price?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>🏘️ Type</label>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '4px 0 0 0' }}>
                    {typeof modalState.property.property_type === 'object' 
                      ? modalState.property.property_type?.display_name 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>🛏️ Bedrooms</label>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '4px 0 0 0' }}>
                    {modalState.property.bedrooms}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>🚿 Bathrooms</label>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '4px 0 0 0' }}>
                    {modalState.property.bathrooms}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>📏 Area</label>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '4px 0 0 0' }}>
                    {modalState.property.sq_meters} m²
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>📊 Status</label>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: typeof modalState.property.property_status === 'object'
                      ? modalState.property.property_status?.color || '#6b7280'
                      : '#6b7280',
                    margin: '4px 0 0 0'
                  }}>
                    {typeof modalState.property.property_status === 'object'
                      ? modalState.property.property_status?.display_name
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                  Description
                </label>
                <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6', margin: 0 }}>
                  {modalState.property.description || 'No description provided'}
                </p>
              </div>

              {modalState.property.features && modalState.property.features.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                    Features
                  </label>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {modalState.property.features.map(feature => (
                      <span
                        key={feature.id}
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#e5f3ff',
                          color: '#0073e6',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        {feature.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '20px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <button
                onClick={handleCloseModal}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6';
                }}
              >
                Close
              </button>
              <button
                onClick={() => handleEditProperty(modalState.property!)}
                style={{
                  backgroundColor: '#0073e6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#0059b3';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#0073e6';
                }}
              >
                Edit Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modalState.isOpen && modalState.type === 'edit' && editFormData && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: 'white'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                Edit Property
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {editMessage && (
                <div style={{
                  backgroundColor: editMessage.type === 'success' ? '#d1fae5' : '#fee2e2',
                  color: editMessage.type === 'success' ? '#065f46' : '#991b1b',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  border: `1px solid ${editMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                }}>
                  {editMessage.text}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleSaveProperty(); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '6px' }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => handleEditFormChange('title', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '6px' }}>
                    Description
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Price and Type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '6px' }}>
                      Price ($)
                    </label>
                    <input
                      type="number"
                      value={editFormData.price}
                      onChange={(e) => handleEditFormChange('price', parseFloat(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '6px' }}>
                      Property Type
                    </label>
                    <select
                      value={editFormData.property_type_id}
                      onChange={(e) => handleEditFormChange('property_type_id', parseInt(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    >
                      {propertyTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Address and City */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '6px' }}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={editFormData.address}
                    onChange={(e) => handleEditFormChange('address', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      marginBottom: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={editFormData.city}
                    onChange={(e) => handleEditFormChange('city', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Bedrooms, Bathrooms, Area */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '6px' }}>
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      value={editFormData.bedrooms}
                      onChange={(e) => handleEditFormChange('bedrooms', parseInt(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '6px' }}>
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      value={editFormData.bathrooms}
                      onChange={(e) => handleEditFormChange('bathrooms', parseInt(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '6px' }}>
                      Area (m²)
                    </label>
                    <input
                      type="number"
                      value={editFormData.sq_meters}
                      onChange={(e) => handleEditFormChange('sq_meters', parseInt(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={editFormData.property_status_id}
                    onChange={(e) => handleEditFormChange('property_status_id', parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    {propertyStatuses.map(status => (
                      <option key={status.id} value={status.id}>
                        {status.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Features */}
                {propertyFeatures.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
                      Features
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                      gap: '12px'
                    }}>
                      {propertyFeatures.map(feature => (
                        <label
                          key={feature.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            padding: '8px 12px',
                            backgroundColor: editFormData.features.includes(feature.id) ? '#e5f3ff' : '#f9fafb',
                            borderRadius: '6px',
                            border: `1px solid ${editFormData.features.includes(feature.id) ? '#bfdbfe' : '#e5e7eb'}`
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={editFormData.features.includes(feature.id)}
                            onChange={() => handleFeatureToggle(feature.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '14px', color: '#1f2937' }}>
                            {feature.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '20px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <button
                onClick={handleCloseModal}
                disabled={submitting}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: submitting ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!submitting) (e.target as HTMLButtonElement).style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  if (!submitting) (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProperty}
                disabled={submitting}
                style={{
                  backgroundColor: '#0073e6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: submitting ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!submitting) (e.target as HTMLButtonElement).style.backgroundColor = '#0059b3';
                }}
                onMouseLeave={(e) => {
                  if (!submitting) (e.target as HTMLButtonElement).style.backgroundColor = '#0073e6';
                }}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
