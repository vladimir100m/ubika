import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@auth0/nextjs-auth0/client';
import styles from '../../styles/Seller.module.css';
import { Property, PropertyFormData } from '../../types';
import ImageUpload from '../../components/ImageUpload';
import Header from 'components/Header';

interface PropertyType {
  id: number;
  name: string;
  display_name: string;
}

interface PropertyStatus {
  id: number;
  name: string;
  display_name: string;
  color: string;
}

interface PropertyFeature {
  id: number;
  name: string;
  category: string;
  icon: string;
}

interface PropertyOperationStatus {
  id: number;
  name: string;
  display_name: string;
  description: string;
}

const SellerDashboard: React.FC = () => {
  const router = useRouter();
  const { user, error, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit'>('list');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    price: '',
    address: '',
    city: '',
    state: '',
    country: '',
    type: '',
    rooms: 0,
    bathrooms: 0,
    squareMeters: 0,
    status: 'available',
    operation_status_id: 1, // Default to Sale
    seller_id: ''
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [propertyStatuses, setPropertyStatuses] = useState<PropertyStatus[]>([]);
  const [propertyOperationStatuses, setPropertyOperationStatuses] = useState<PropertyOperationStatus[]>([]);
  const [loadingFormData, setLoadingFormData] = useState(true);
  const [propertyFeatures, setPropertyFeatures] = useState<PropertyFeature[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      // Redirect to login if user is not authenticated
      router.push('/api/auth/login');
      return;
    }
    
    // Set seller_id in form data
    setFormData(prev => ({ ...prev, seller_id: user.sub || '' }));
    
    // Fetch seller properties once user is authenticated
    fetchSellerProperties();
  }, [user, isLoading, router]);

  // Fetch property types and statuses
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        // Fetch property types
        const typesResponse = await fetch('/api/property-types');
        if (typesResponse.ok) {
          const types = await typesResponse.json();
          setPropertyTypes(types);
        }

        // Fetch property statuses
        const statusesResponse = await fetch('/api/property-statuses');
        if (statusesResponse.ok) {
          const statuses = await statusesResponse.json();
          setPropertyStatuses(statuses);
        }

        // Fetch property operation statuses
        const operationStatusesResponse = await fetch('/api/property-operation-statuses');
        if (operationStatusesResponse.ok) {
          const operationStatuses = await operationStatusesResponse.json();
          setPropertyOperationStatuses(operationStatuses);
        }

        // Fetch property features
        const featuresResponse = await fetch('/api/property-features');
        if (featuresResponse.ok) {
          const features = await featuresResponse.json();
          setPropertyFeatures(features);
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
      } finally {
        setLoadingFormData(false);
      }
    };

    fetchFormData();
  }, []);

  const fetchSellerProperties = async () => {
    if (!user?.sub) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/properties/seller?seller_id=${user.sub}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to fetch properties: ${errorData.error || response.statusText}`);
      }
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching seller properties:', error);
      setMessage({
        text: `Failed to load your properties. ${error instanceof Error ? error.message : 'Please try again later.'}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: any = value;

    // Convert numeric fields
    if (['rooms', 'bathrooms', 'squareMeters', 'yearBuilt', 'operation_status_id'].includes(name)) {
      parsedValue = value === '' ? 0 : Number(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      // Determine if we're creating a new property or updating an existing one
      const isEditing = editingPropertyId !== null;
      const url = isEditing 
        ? `/api/properties/update?id=${editingPropertyId}` 
        : '/api/properties/create';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} property`);
      }

      const propertyData = await response.json();
      const propertyId = isEditing ? editingPropertyId : propertyData.id;

      // Update property features if any are selected
      if (selectedFeatures.length > 0) {
        const featuresResponse = await fetch('/api/properties/features/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propertyId,
            featureIds: selectedFeatures
          }),
        });

        if (!featuresResponse.ok) {
          const errorData = await featuresResponse.json();
          console.error('Error updating property features:', errorData.error);
          // Don't throw here as the property was created successfully
          setMessage({
            text: `Property ${isEditing ? 'updated' : 'created'} successfully, but there was an issue updating features.`,
            type: 'error'
          });
          return;
        }
      }

      // Success - reset form and show message
      resetForm();
      
      setMessage({
        text: `Property ${isEditing ? 'updated' : 'listed'} successfully!`,
        type: 'success'
      });
      
      // Refresh the properties list
      fetchSellerProperties();
      
      // Switch to the list tab after successful submission
      setActiveTab('list');
    } catch (error) {
      console.error(`Error ${editingPropertyId ? 'updating' : 'creating'} property:`, error);
      setMessage({
        text: error instanceof Error ? error.message : `Failed to ${editingPropertyId ? 'update' : 'create'} property`,
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      address: '',
      city: '',
      state: '',
      country: '',
      type: '',
      rooms: 0,
      bathrooms: 0,
      squareMeters: 0,
      status: 'available',
      operation_status_id: 1, // Default to Sale
      seller_id: user?.sub || ''
    });
    setEditingPropertyId(null);
    setSelectedFeatures([]);
  };

  const fetchPropertyFeatures = async (propertyId: number) => {
    try {
      const response = await fetch(`/api/properties/features?propertyId=${propertyId}`);
      if (response.ok) {
        const features = await response.json();
        const featureIds = features.map((f: any) => f.feature_id);
        setSelectedFeatures(featureIds);
      } else {
        console.error('Failed to fetch property features');
        setSelectedFeatures([]);
      }
    } catch (error) {
      console.error('Error fetching property features:', error);
      setSelectedFeatures([]);
    }
  };

  const handleEditProperty = (property: Property) => {
    // Populate the form with the property data
    setFormData({
      title: property.title,
      description: property.description,
      price: property.price,
      address: property.address,
      city: property.city,
      state: property.state,
      country: property.country,
      zip_code: property.zip_code,
      type: property.type,
      rooms: property.rooms,
      bathrooms: property.bathrooms,
      squareMeters: property.squareMeters,
      status: property.status,
      image_url: property.image_url,
      yearBuilt: property.yearBuilt,
      operation_status_id: property.operation_status_id || 1, // Default to Sale if not set
      seller_id: user?.sub || ''
    });
    
    // Set the editing property ID
    setEditingPropertyId(property.id);
    
    // Fetch and set the property's features
    fetchPropertyFeatures(property.id);
    
    // Switch to the edit tab
    setActiveTab('edit');
  };

  const handleUpdatePropertyStatus = async (propertyId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/properties/update?id=${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update property status');
      }

      // Refresh the properties list
      fetchSellerProperties();
      
      setMessage({
        text: 'Property status updated successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating property status:', error);
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to update property status',
        type: 'error'
      });
    }
  };

  const handleDeleteProperty = async (propertyId: number) => {
    // Confirm deletion with the user
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/properties/delete?id=${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          seller_id: user?.sub 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete property');
      }

      // Refresh the properties list
      fetchSellerProperties();
      
      setMessage({
        text: 'Property deleted successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting property:', error);
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to delete property',
        type: 'error'
      });
    }
  };

  // Add className to all labels and form controls
  const updateFormClasses = () => {
    // Add className={styles.formLabel} to all labels
    const labels = document.querySelectorAll('label');
    labels.forEach(label => {
      if (!label.className.includes(styles.formLabel)) {
        label.className = label.className ? `${label.className} ${styles.formLabel}` : styles.formLabel;
      }
    });

    // Add appropriate className to all inputs, textareas, and selects
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      if (!input.className.includes(styles.formInput)) {
        input.className = input.className ? `${input.className} ${styles.formInput}` : styles.formInput;
      }
    });

    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      if (!textarea.className.includes(styles.formTextarea)) {
        textarea.className = textarea.className ? `${textarea.className} ${styles.formTextarea}` : styles.formTextarea;
      }
    });

    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
      if (!select.className.includes(styles.formSelect)) {
        select.className = select.className ? `${select.className} ${styles.formSelect}` : styles.formSelect;
      }
    });
  };

  // Call this function when the component mounts and when the activeTab changes
  useEffect(() => {
    if (user?.sub) {
      fetchSellerProperties();
    }
    // Only run in the browser, not during SSR
    if (typeof window !== 'undefined') {
      updateFormClasses();
    }
  }, [activeTab, user]);

  // Authentication checks
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) {
    // This should not happen as useEffect redirects, but just in case
    return <div>Redirecting to login...</div>;
  }

  return (
    <div>
      <Header />
      <div className={styles.container}>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'list' ? styles.active : ''}`}
            onClick={() => setActiveTab('list')}
          >
            My Properties
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'add' ? styles.active : ''}`}
            onClick={() => {
              resetForm();
              setActiveTab('add');
            }}
          >
            Add New Property
          </button>
          {activeTab === 'edit' && (
            <button 
              className={`${styles.tabButton} ${activeTab === 'edit' ? styles.active : ''}`}
            >
              Edit Property
            </button>
          )}
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className={styles.closeMessage}>×</button>
          </div>
        )}

        {activeTab === 'list' ? (
          <div className={styles.propertiesList}>
            <h2>My Listed Properties</h2>
            {loading ? (
              <div className={styles.loading}>Loading your properties...</div>
            ) : properties.length === 0 ? (
              <div className={styles.emptyState}>
                <p>You haven't listed any properties yet.</p>
                <p>As a seller, you can add properties, update their status, and manage your listings all in one place.</p>
                <button 
                  onClick={() => setActiveTab('add')}
                  className={styles.addPropertyButton}
                >
                  Add Your First Property
                </button>
              </div>
            ) : (
              <div className={styles.propertyGrid}>
                {properties.map(property => (
                  <div key={property.id} className={styles.propertyCard}>
                    <div className={styles.propertyImageContainer}>
                      <img 
                        src={property.image_url} 
                        alt={property.title}
                        className={styles.propertyImage}
                      />
                      <div className={styles.propertyPrice}>${property.price}</div>
                    </div>
                    <div className={styles.propertyDetails}>
                      <h3>{property.title}</h3>
                      <p className={styles.propertyAddress}>{property.address}</p>
                      <div className={styles.propertySpecs}>
                        <span>{property.rooms} rooms</span> • 
                        <span>{property.bathrooms} baths</span> • 
                        <span>{property.squareMeters} m²</span>
                      </div>
                      <div className={styles.propertyStatus}>
                        Status: <span className={styles[property.status]}>{property.status}</span>
                      </div>
                      <div className={styles.propertyDate}>
                        Listed on: {new Date(property.created_at).toLocaleDateString()}
                      </div>
                      <div className={styles.propertyActions}>
                        <button 
                          className={styles.editButton}
                          onClick={() => handleEditProperty(property)}
                        >
                          Edit
                        </button>
                        {property.status === 'available' && (
                          <button 
                            className={styles.markPendingButton}
                            onClick={() => handleUpdatePropertyStatus(property.id, 'pending')}
                          >
                            Mark Pending
                          </button>
                        )}
                        {property.status === 'pending' && (
                          <button 
                            className={styles.markAvailableButton}
                            onClick={() => handleUpdatePropertyStatus(property.id, 'available')}
                          >
                            Mark Available
                          </button>
                        )}
                        {property.status === 'pending' && (
                          <button 
                            className={styles.markSoldButton}
                            onClick={() => handleUpdatePropertyStatus(property.id, 'sold')}
                          >
                            Mark Sold
                          </button>
                        )}
                        {property.status === 'sold' && (
                          <button 
                            className={styles.markAvailableButton}
                            onClick={() => handleUpdatePropertyStatus(property.id, 'available')}
                          >
                            Re-List
                          </button>
                        )}
                        <button 
                          className={styles.deleteButton}
                          onClick={() => handleDeleteProperty(property.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.addPropertyForm}>
            <h2>{activeTab === 'edit' ? 'Edit Property' : 'List a New Property'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="title" className={styles.formLabel}>Property Title*</label>
                <input 
                  type="text" 
                  id="title" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="e.g., Modern Apartment with Ocean View"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.formLabel}>Description*</label>
                <textarea 
                  id="description" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  required 
                  rows={4}
                  placeholder="Describe your property in detail"
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="price" className={styles.formLabel}>Price (USD)*</label>
                  <input 
                    type="text" 
                    id="price" 
                    name="price" 
                    value={formData.price} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="e.g., 250000"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="type" className={styles.formLabel}>Property Type*</label>
                  <select 
                    id="type" 
                    name="type" 
                    value={formData.type} 
                    onChange={handleInputChange} 
                    required
                    className={styles.formSelect}
                  >
                    <option value="">Select type</option>
                    {loadingFormData ? (
                      <option value="" disabled>Loading...</option>
                    ) : (
                      propertyTypes.map(type => (
                        <option key={type.id} value={type.name}>
                          {type.display_name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="address" className={styles.formLabel}>Street Address*</label>                <input 
                    type="text" 
                    id="address" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleInputChange} 
                    required 
                    className={styles.formInput}
                  />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="city" className={styles.formLabel}>City*</label>
                  <input 
                    type="text" 
                    id="city" 
                    name="city" 
                    value={formData.city} 
                    onChange={handleInputChange} 
                    required 
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="state" className={styles.formLabel}>State/Province*</label>
                  <input 
                    type="text" 
                    id="state" 
                    name="state" 
                    value={formData.state} 
                    onChange={handleInputChange} 
                    required 
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="country" className={styles.formLabel}>Country*</label>
                  <input 
                    type="text" 
                    id="country" 
                    name="country" 
                    value={formData.country} 
                    onChange={handleInputChange} 
                    required 
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="zip_code" className={styles.formLabel}>ZIP/Postal Code</label>
                  <input 
                    type="text" 
                    id="zip_code" 
                    name="zip_code" 
                    value={formData.zip_code || ''} 
                    onChange={handleInputChange}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="rooms" className={styles.formLabel}>Number of Rooms*</label>
                  <input 
                    type="number" 
                    id="rooms" 
                    name="rooms" 
                    value={formData.rooms} 
                    onChange={handleInputChange} 
                    required 
                    min="0"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="bathrooms" className={styles.formLabel}>Number of Bathrooms*</label>
                  <input 
                    type="number" 
                    id="bathrooms" 
                    name="bathrooms" 
                    value={formData.bathrooms} 
                    onChange={handleInputChange} 
                    required 
                    min="0"
                    step="0.5"
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="squareMeters" className={styles.formLabel}>Area (square meters)*</label>
                  <input 
                    type="number" 
                    id="squareMeters" 
                    name="squareMeters" 
                    value={formData.squareMeters} 
                    onChange={handleInputChange} 
                    required 
                    min="0"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="status" className={styles.formLabel}>Status*</label>
                  <select 
                    id="status" 
                    name="status" 
                    value={formData.status} 
                    onChange={handleInputChange} 
                    required
                    className={styles.formSelect}
                  >
                    {loadingFormData ? (
                      <option value="" disabled>Loading...</option>
                    ) : (
                      propertyStatuses.map(status => (
                        <option key={status.id} value={status.name}>
                          {status.display_name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="operation_status_id" className={styles.formLabel}>Operation Type*</label>
                  <select 
                    id="operation_status_id" 
                    name="operation_status_id" 
                    value={formData.operation_status_id || 1} 
                    onChange={handleInputChange} 
                    required
                    className={styles.formSelect}
                  >
                    {loadingFormData ? (
                      <option value="" disabled>Loading...</option>
                    ) : (
                      propertyOperationStatuses.map(operationStatus => (
                        <option key={operationStatus.id} value={operationStatus.id}>
                          {operationStatus.display_name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="yearBuilt" className={styles.formLabel}>Year Built</label>
                  <input 
                    type="number" 
                    id="yearBuilt" 
                    name="yearBuilt" 
                    value={formData.yearBuilt || ''} 
                    onChange={handleInputChange} 
                    placeholder="e.g., 2010"
                    min="1800"
                    max={new Date().getFullYear()}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Property Image</label>
                <ImageUpload 
                  onImageChange={(imageUrl) => setFormData(prev => ({...prev, image_url: imageUrl}))}
                  defaultValue={formData.image_url}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Property Features</label>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                  Select the features that apply to your property
                </p>
                {loadingFormData ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    Loading features...
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                    gap: '12px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #e1e5e9',
                    borderRadius: '4px',
                    padding: '16px'
                  }}>
                    {propertyFeatures.map(feature => (
                      <label key={feature.id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '4px',
                        border: selectedFeatures.includes(feature.id) ? '2px solid #1277e1' : '1px solid #e1e5e9',
                        backgroundColor: selectedFeatures.includes(feature.id) ? '#f0f7ff' : 'white'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedFeatures.includes(feature.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFeatures(prev => [...prev, feature.id]);
                            } else {
                              setSelectedFeatures(prev => prev.filter(id => id !== feature.id));
                            }
                          }}
                          style={{ marginRight: '4px' }}
                        />
                        <span style={{ fontSize: '16px' }}>{feature.icon || '•'}</span>
                        <span style={{ fontSize: '14px' }}>{feature.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button 
                  type="button" 
                  onClick={() => {
                    resetForm();
                    setActiveTab('list');
                  }} 
                  className={styles.cancelButton}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : activeTab === 'edit' ? 'Update Property' : 'List Property'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
