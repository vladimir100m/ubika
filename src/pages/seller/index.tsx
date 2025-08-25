import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import styles from '../../styles/Seller.module.css';
import standardStyles from '../../styles/StandardComponents.module.css';
import { Property, PropertyFormData, PropertyImage } from '../../types';
// ...existing code...
import PropertyImageEditor from '../../components/PropertyImageEditor';
import { StandardLayout } from '../../components';
import { FilterOptions } from '../../components/MapFilters';

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
  category?: string;
  icon?: string;
}

interface PropertyOperationStatus {
  id: number;
  name: string;
  display_name: string;
  description: string;
}

const SellerDashboard: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const u = useMemo(() => 
    user as (typeof user & { sub?: string; picture?: string | null; image?: string | null }),
    [user]
  );
  const isLoading = status === 'loading';

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

  // Helper function to get the cover image for property display
  const getCoverImageUrl = (property: Property): string => {
    // First check if property has uploaded images with a cover image
    if (property.images && property.images.length > 0) {
      const coverImage = property.images.find(img => img.is_cover);
      if (coverImage) {
        return coverImage.image_url;
      }
      // If no cover image is set, use the first uploaded image
      const sortedImages = property.images.sort((a, b) => a.display_order - b.display_order);
      return sortedImages[0].image_url;
    }

    // Fallback to single image_url if available
    if (property.image_url) {
      return property.image_url;
    }

    // Final fallback to sample images based on property type
    const typeImages: { [key: string]: string } = {
      'house': '/properties/casa-moderna.jpg',
      'apartment': '/properties/apartamento-moderno.jpg',
      'villa': '/properties/villa-lujo.jpg',
      'penthouse': '/properties/penthouse-lujo.jpg',
      'cabin': '/properties/cabana-bosque.jpg',
      'loft': '/properties/loft-urbano.jpg',
      'duplex': '/properties/duplex-moderno.jpg'
    };

    const propertyType = property.type?.toLowerCase() || 'house';
    return typeImages[propertyType] || '/properties/casa-moderna.jpg';
  };

  // Helper function to get image count for display
  const getImageCount = (property: Property): number => {
    if (property.images && property.images.length > 0) {
      return property.images.length;
    }
    return property.image_url ? 1 : 0;
  };

  // Helper function to get cover image info for display
  const getCoverImageInfo = (property: Property): string => {
    if (property.images && property.images.length > 0) {
      const coverImage = property.images.find(img => img.is_cover);
      if (coverImage) {
        return "Cover image from uploads";
      }
      return "First uploaded image";
    }
    if (property.image_url) {
      return "Legacy image";
    }
    return "Sample image";
  };

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
  seller_id: '',
  zip_code: '',
  yearBuilt: undefined,
  image_url: ''
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [propertyStatuses, setPropertyStatuses] = useState<PropertyStatus[]>([]);
  const [propertyOperationStatuses, setPropertyOperationStatuses] = useState<PropertyOperationStatus[]>([]);
  const [loadingFormData, setLoadingFormData] = useState(true);
  const [propertyFeatures, setPropertyFeatures] = useState<PropertyFeature[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
  // Updated state for API-based image management
  const [propertyImages, setPropertyImages] = useState<PropertyImage[]>([]);
  const [currentPropertyId, setCurrentPropertyId] = useState<string | number | null>(null);

  // Load property images from API
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
      console.error('Error loading property images:', error);
      setPropertyImages([]);
    }
  };

  const fetchSellerProperties = useCallback(async () => {
    if (!u?.sub) return;
      
    setLoading(true);
    try {
      const response = await fetch(`/api/properties/seller?seller_id=${u.sub}`);
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
  }, [u?.sub]);

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      // Redirect to login if user is not authenticated
      router.push('/api/auth/signin');
      return;
    }
    
    // Fetch seller properties once user is authenticated
    if (u?.sub) {
      fetchSellerProperties();
    }
  }, [user, isLoading]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: any = value;

    // Convert numeric fields
    if (['rooms', 'bathrooms', 'squareMeters', 'yearBuilt', 'operation_status_id'].includes(name)) {
      if (name === 'rooms' || name === 'bathrooms') {
        // Parse as integer for rooms and bathrooms
        parsedValue = value === '' ? 0 : parseInt(value, 10) || 0;
      } else {
        // Use Number for other numeric fields that might have decimals
        parsedValue = value === '' ? 0 : Number(value);
      }
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

      // Prepare payload and strip large base64 image strings to avoid 413 (>1MB)
      let payload = { ...formData } as any;
      if (payload.image_url && typeof payload.image_url === 'string' && payload.image_url.startsWith('data:image')) {
        const approxBytes = Math.ceil((payload.image_url.length * 3) / 4); // base64 size estimate
        const ONE_MB = 1024 * 1024;
        if (approxBytes > 750 * 1024) { // be conservative below 1MB limit
          console.warn('Stripping large inline image from payload (size:', approxBytes, ')');
          // Option 1: remove image so API keeps existing or assigns default
          delete payload.image_url;
          // Optionally set a placeholder if new property without image
          if (!isEditing) {
            payload.image_url = '/properties/casa-moderna.jpg';
          }
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} property`);
      }

      const propertyData = await response.json();
      const propertyId = isEditing ? editingPropertyId : propertyData.id;

      // If we just created a new property, update the current property ID for image uploads
      if (!isEditing && propertyData.id) {
        setCurrentPropertyId(propertyData.id);
      }

      // Update property features if any are selected
      if (selectedFeatures.length > 0) {
        const featuresResponse = await fetch('/api/properties/features/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propertyId,
            featureIds: selectedFeatures,
            seller_id: u?.sub
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
      setActiveTab('list'); // Switch to list view after creation/update
      
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
      seller_id: u?.sub || '',
      zip_code: '',
      yearBuilt: undefined,
      image_url: ''
    });
    setEditingPropertyId(null);
    setSelectedFeatures([]);
    setPropertyImages([]);
    setCurrentPropertyId(null);
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
      yearBuilt: property.yearBuilt ?? undefined,
      operation_status_id: property.operation_status_id || 1, // Default to Sale if not set
      seller_id: u?.sub || ''
    });
    
    // Load property images from API
    setCurrentPropertyId(property.id);
    loadPropertyImages(property.id);
    
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
  body: JSON.stringify({ status: newStatus, seller_id: u?.sub }),
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
          seller_id: u?.sub 
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

  // Call this function when the component mounts and when the activeTab changes
  useEffect(() => {
    if (u?.sub) {
      fetchSellerProperties();
    }
  }, [activeTab, u?.sub]);

  // Authentication checks
  if (isLoading) return <div>Loading...</div>;
  // Note: no `error` from useSession; rely on status and user.
  if (!user) {
    // This should not happen as useEffect redirects, but just in case
    return <div>Redirecting to login...</div>;
  }

  return (
    <StandardLayout 
      title="Seller Dashboard" 
      subtitle="Manage your property listings"
      showMapFilters={true}
      onFilterChange={handleFilterChange}
      onSearchLocationChange={handleSearchLocationChange}
      searchLocation=""
      initialFilters={{}}
    >
      <div className={standardStyles.pageContainer}>

        <div className={standardStyles.tabNavigation}>
          <button 
            className={`${standardStyles.tabButton} ${activeTab === 'list' ? standardStyles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('list')}
          >
            My Properties
          </button>
          <button 
            className={`${standardStyles.tabButton} ${activeTab === 'add' ? standardStyles.tabButtonActive : ''}`}
            onClick={() => {
              resetForm();
              setActiveTab('add');
            }}
          >
            Add New Property
          </button>
          {activeTab === 'edit' && (
            <button 
              className={`${standardStyles.tabButton} ${activeTab === 'edit' ? standardStyles.tabButtonActive : ''}`}
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
              <div className={styles.sellerPropertyGrid}>
                {properties.map(property => (
                  <div key={property.id} className={styles.propertyCard}>
                    <div className={styles.propertyImageContainer}>
                      <img 
                        src={getCoverImageUrl(property)} 
                        alt={property.title}
                        className={styles.propertyImage}
                        onError={(e) => {
                          // Fallback image if main image fails to load
                          (e.target as HTMLImageElement).src = '/properties/casa-moderna.jpg';
                        }}
                      />
                      <div className={styles.propertyPrice}>${property.price?.toLocaleString()}</div>
                      <div className={styles.propertyImageBadge}>
                        📷 {getImageCount(property)} photo{getImageCount(property) !== 1 ? 's' : ''}
                      </div>
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
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>
                <span className={styles.formIcon}>
                  {activeTab === 'edit' ? '✏️' : '🏠'}
                </span>
                {activeTab === 'edit' ? 'Edit Property' : 'List a New Property'}
              </h2>
              <p className={styles.formDescription}>
                {activeTab === 'edit' 
                  ? 'Update your property information and manage its visibility' 
                  : 'Fill out the details below to list your property and reach potential buyers or renters'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Basic Information Section */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>📝</span>
                  Basic Information
                </h3>
                <p className={styles.sectionDescription}>
                  Start with the essential details about your property
                </p>

                <div className={styles.formGroup}>
                  <label htmlFor="title" className={styles.formLabel}>Property Title*</label>
                  <input 
                    type="text" 
                    id="title" 
                    name="title" 
                    value={formData.title ?? ''} 
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
                    value={formData.description ?? ''} 
                    onChange={handleInputChange} 
                    required 
                    rows={4}
                    placeholder="Describe your property in detail - highlight unique features, nearby amenities, and what makes it special"
                    className={styles.formTextarea}
                  />
                </div>
              </div>

              {/* Location Section */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>📍</span>
                  Location Details
                </h3>
                <p className={styles.sectionDescription}>
                  Specify the exact location of your property
                </p>

                <div className={styles.formGroup}>
                  <label htmlFor="address" className={styles.formLabel}>Street Address*</label>
                  <input 
                    type="text" 
                    id="address" 
                    name="address" 
                    value={formData.address ?? ''} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="e.g., 123 Main Street, Apartment 4B"
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
                      value={formData.city ?? ''} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="e.g., Miami"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="state" className={styles.formLabel}>State/Province*</label>
                    <input 
                      type="text" 
                      id="state" 
                      name="state" 
                      value={formData.state ?? ''} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="e.g., Florida"
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
                      value={formData.country ?? ''} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="e.g., United States"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="zip_code" className={styles.formLabel}>ZIP/Postal Code</label>
                    <input 
                      type="text" 
                      id="zip_code" 
                      name="zip_code" 
                      value={formData.zip_code ?? ''} 
                      onChange={handleInputChange}
                      placeholder="e.g., 33101"
                      className={styles.formInput}
                    />
                  </div>
                </div>
              </div>

              {/* Basic Property Details Section */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>🏠</span>
                  Basic Property Details
                </h3>
                <p className={styles.sectionDescription}>
                  Essential information about your property's physical characteristics
                </p>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="rooms" className={styles.formLabel}>Bedrooms*</label>
                    <div className={styles.numberInputContainer}>
                      <input 
                        type="number" 
                        id="rooms" 
                        name="rooms" 
                        value={formData.rooms ?? 0} 
                        onChange={handleInputChange} 
                        required 
                        min="0"
                        max="20"
                        step="1"
                        className={styles.numberInput}
                        placeholder="e.g., 3"
                      />
                      <div className={styles.numberControls}>
                        <button 
                          type="button" 
                          className={styles.numberControlUp}
                          onClick={() => {
                            const newValue = Math.min((formData.rooms || 0) + 1, 20);
                            setFormData(prev => ({ ...prev, rooms: newValue }));
                          }}
                          aria-label="Increase bedrooms"
                        >
                          ▲
                        </button>
                        <button 
                          type="button" 
                          className={styles.numberControlDown}
                          onClick={() => {
                            const newValue = Math.max((formData.rooms || 0) - 1, 0);
                            setFormData(prev => ({ ...prev, rooms: newValue }));
                          }}
                          aria-label="Decrease bedrooms"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="bathrooms" className={styles.formLabel}>Bathrooms*</label>
                    <div className={styles.numberInputContainer}>
                      <input 
                        type="number" 
                        id="bathrooms" 
                        name="bathrooms" 
                        value={formData.bathrooms ?? 0} 
                        onChange={handleInputChange} 
                        required 
                        min="0"
                        max="10"
                        step="1"
                        className={styles.numberInput}
                        placeholder="e.g., 2"
                      />
                      <div className={styles.numberControls}>
                        <button 
                          type="button" 
                          className={styles.numberControlUp}
                          onClick={() => {
                            const newValue = Math.min((formData.bathrooms || 0) + 1, 10);
                            setFormData(prev => ({ ...prev, bathrooms: newValue }));
                          }}
                          aria-label="Increase bathrooms"
                        >
                          ▲
                        </button>
                        <button 
                          type="button" 
                          className={styles.numberControlDown}
                          onClick={() => {
                            const newValue = Math.max((formData.bathrooms || 0) - 1, 0);
                            setFormData(prev => ({ ...prev, bathrooms: newValue }));
                          }}
                          aria-label="Decrease bathrooms"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="squareMeters" className={styles.formLabel}>Area (m²)*</label>
                    <div className={styles.numberInputContainer}>
                      <input 
                        type="number" 
                        id="squareMeters" 
                        name="squareMeters" 
                        value={formData.squareMeters ?? 0} 
                        onChange={handleInputChange} 
                        required 
                        min="0"
                        max="10000"
                        step="1"
                        className={styles.numberInput}
                        placeholder="e.g., 120"
                      />
                      <div className={styles.numberControls}>
                        <button 
                          type="button" 
                          className={styles.numberControlUp}
                          onClick={() => {
                            const newValue = Math.min((formData.squareMeters || 0) + 10, 10000);
                            setFormData(prev => ({ ...prev, squareMeters: newValue }));
                          }}
                          aria-label="Increase area by 10 m²"
                        >
                          ▲
                        </button>
                        <button 
                          type="button" 
                          className={styles.numberControlDown}
                          onClick={() => {
                            const newValue = Math.max((formData.squareMeters || 0) - 10, 0);
                            setFormData(prev => ({ ...prev, squareMeters: newValue }));
                          }}
                          aria-label="Decrease area by 10 m²"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="yearBuilt" className={styles.formLabel}>Year Built</label>
                    <div className={styles.numberInputContainer}>
                      <input 
                        type="number" 
                        id="yearBuilt" 
                        name="yearBuilt" 
                        value={formData.yearBuilt ?? ''} 
                        onChange={handleInputChange} 
                        placeholder="e.g., 2010"
                        min="1800"
                        max={new Date().getFullYear()}
                        step="1"
                        className={styles.numberInput}
                      />
                      <div className={styles.numberControls}>
                        <button 
                          type="button" 
                          className={styles.numberControlUp}
                          onClick={() => {
                            const currentYear = new Date().getFullYear();
                            const newValue = Math.min((formData.yearBuilt || currentYear) + 1, currentYear);
                            setFormData(prev => ({ ...prev, yearBuilt: newValue }));
                          }}
                          aria-label="Increase year"
                        >
                          ▲
                        </button>
                        <button 
                          type="button" 
                          className={styles.numberControlDown}
                          onClick={() => {
                            const newValue = Math.max((formData.yearBuilt || 2000) - 1, 1800);
                            setFormData(prev => ({ ...prev, yearBuilt: newValue }));
                          }}
                          aria-label="Decrease year"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="type" className={styles.formLabel}>Property Type*</label>
                    <select 
                      id="type" 
                      name="type" 
                      value={formData.type ?? ''} 
                      onChange={handleInputChange} 
                      required
                      className={styles.formSelect}
                    >
                      <option value="" disabled>Select property type</option>
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

                  <div className={styles.formGroup}>
                    <label htmlFor="status" className={styles.formLabel}>Status*</label>
                    <select 
                      id="status" 
                      name="status" 
                      value={formData.status ?? 'available'} 
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
                    value={formData.operation_status_id ?? 1} 
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
                  <div className={styles.numberInputContainer}>
                    <input 
                      type="number" 
                      id="yearBuilt" 
                      name="yearBuilt" 
                      value={formData.yearBuilt ?? ''} 
                      onChange={handleInputChange} 
                      placeholder="e.g., 2010"
                      min="1800"
                      max={new Date().getFullYear()}
                      step="1"
                      className={styles.numberInput}
                    />
                    <div className={styles.numberControls}>
                      <button 
                        type="button" 
                        className={styles.numberControlUp}
                        onClick={() => {
                          const currentYear = new Date().getFullYear();
                          const newValue = Math.min((formData.yearBuilt || currentYear) + 1, currentYear);
                          setFormData(prev => ({ ...prev, yearBuilt: newValue }));
                        }}
                        aria-label="Increase year"
                      >
                        ▲
                      </button>
                      <button 
                        type="button" 
                        className={styles.numberControlDown}
                        onClick={() => {
                          const newValue = Math.max((formData.yearBuilt || 2000) - 1, 1800);
                          setFormData(prev => ({ ...prev, yearBuilt: newValue }));
                        }}
                        aria-label="Decrease year"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {/* Property Images Section */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>📷</span>
                  Property Images
                </h3>
                <p className={styles.sectionDescription}>
                  Upload high-quality images to showcase your property
                </p>

                <PropertyImageEditor
                  propertyId={currentPropertyId || undefined}
                  sellerId={u?.sub || u?.email || 'anonymous'}
                  images={propertyImages}
                  onChange={(images: PropertyImage[]) => {
                    setPropertyImages(images);
                    // Update form data with cover image URL for backward compatibility
                    const coverImage = images.find(img => img.is_cover);
                    if (coverImage) {
                      setFormData(prev => ({ ...prev, image_url: coverImage.image_url }));
                    }
                  }}
                  maxImages={15}
                  allowBulkOperations={true}
                  showImagePreview={true}
                />
                
                {propertyImages.length > 0 && (
                  <div className={styles.imageStats}>
                    <span className={styles.statsIcon}>📊</span>
                    <span>{propertyImages.length} image{propertyImages.length !== 1 ? 's' : ''} uploaded</span>
                    {propertyImages.find(img => img.is_cover) && (
                      <span className={styles.coverInfo}>
                        • Cover: {propertyImages.find(img => img.is_cover)?.image_url.split('/').pop()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Property Features Section */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>⭐</span>
                  Property Features
                </h3>
                <p className={styles.sectionDescription}>
                  Select all features and amenities that apply to your property
                </p>

                <div className={styles.featureControls}>
                  <span className={styles.featureSummary}>
                    {selectedFeatures.length} of {propertyFeatures.length} features selected
                  </span>
                  <div className={styles.featureActions}>
                    <button
                      type="button"
                      className={styles.quickActionBtn}
                      onClick={() => setSelectedFeatures(propertyFeatures.map(f => f.id))}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      className={styles.quickActionBtn}
                      onClick={() => setSelectedFeatures([])}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {loadingFormData ? (
                  <div className={styles.loadingState}>
                    <div className={styles.loadingSpinner}></div>
                    <span>Loading features...</span>
                  </div>
                ) : (
                  <div className={styles.allFeaturesGrid}>
                    {propertyFeatures.map(feature => (
                      <label key={feature.id} className={`${styles.featureCard} ${
                        selectedFeatures.includes(feature.id) ? styles.featureSelected : ''
                      }`}>
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
                          className={styles.featureCheckbox}
                        />
                        <div className={styles.featureContent}>
                          <span className={styles.featureIcon}>{feature.icon || '🏠'}</span>
                          <span className={styles.featureName}>{feature.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Actions */}
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
                  <span className={styles.buttonIcon}>❌</span>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={submitting}
                >
                  <span className={styles.buttonIcon}>
                    {submitting ? '⏳' : activeTab === 'edit' ? '✏️' : '🏠'}
                  </span>
                  {submitting ? 'Submitting...' : activeTab === 'edit' ? 'Update Property' : 'List Property'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </StandardLayout>
  );
};

export default SellerDashboard;
