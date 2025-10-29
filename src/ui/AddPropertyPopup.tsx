'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PropertyImageEditor from './PropertyImageEditor';
import { Property } from '../types';
import styles from '../styles/Seller.module.css';

interface AddPropertyPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyCreated?: (propertyId: string) => void;
  editingProperty?: Property | null;
  onPropertyUpdated?: (propertyId: string) => void;
}

const AddPropertyPopup: React.FC<AddPropertyPopupProps> = ({ 
  isOpen, 
  onClose,
  onPropertyCreated,
  editingProperty = null,
  onPropertyUpdated
}) => {
  const { data: session } = useSession();
  const imageEditorRef = useRef<any>(null);
  const isEditMode = !!editingProperty;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zip_code: '',
    type: '',
    bedrooms: '',
    bathrooms: '',
    sq_meters: '',
    year_built: '',
    lat: '',
    lng: '',
    operation_status: '',
  });

  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedExistingImages, setRemovedExistingImages] = useState<string[]>([]);
  const [existingImageIds, setExistingImageIds] = useState<(string | number)[]>([]);
  const [coverImageId, setCoverImageId] = useState<string | number | null>(null);
  const [coverImageIndex, setCoverImageIndex] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch property types and features
    const fetchPropertyTypes = async () => {
      try {
        const response = await fetch('/api/property-types');
        if (response.ok) {
          const data = await response.json();
          setPropertyTypes(data);
        }
      } catch (err) {
        console.error('Error fetching property types:', err);
      }
    };

    const fetchFeatures = async () => {
      try {
        const response = await fetch('/api/property-features');
        if (response.ok) {
          const data = await response.json();
          setAvailableFeatures(data);
        }
      } catch (err) {
        console.error('Error fetching features:', err);
      }
    };

    if (isOpen) {
      fetchPropertyTypes();
      fetchFeatures();
      
      // If editing, populate form with property data
      if (editingProperty) {
        setFormData({
          title: editingProperty.title || '',
          description: editingProperty.description || '',
          price: editingProperty.price?.toString() || '',
          address: editingProperty.address || '',
          city: editingProperty.city || '',
          state: editingProperty.state || '',
          country: editingProperty.country || '',
          zip_code: editingProperty.zip_code || '',
          type: editingProperty.property_type?.name || '',
          bedrooms: editingProperty.bedrooms?.toString() || '',
          bathrooms: editingProperty.bathrooms?.toString() || '',
          sq_meters: editingProperty.sq_meters?.toString() || '',
          year_built: editingProperty.year_built?.toString() || '',
          lat: editingProperty.lat?.toString() || '',
          lng: editingProperty.lng?.toString() || '',
          operation_status: editingProperty.operation_status_id === 2 ? 'rent' : 'buy',
        });

        // Populate selected features
        if (editingProperty.features && editingProperty.features.length > 0) {
          const featureIds = editingProperty.features.map(f => f.id);
          setSelectedFeatures(featureIds);
        } else {
          setSelectedFeatures([]);
        }
        
        // Populate existing images
        if (editingProperty.images && editingProperty.images.length > 0) {
          const sortedImages = editingProperty.images
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
          const existingImageUrls = sortedImages.map(img => img.image_url || '');
          const existingIds = sortedImages.map(img => img.id);
          const coverImg = editingProperty.images.find(img => img.is_cover);
          
          setExistingImages(existingImageUrls);
          setExistingImageIds(existingIds);
          
          if (coverImg) {
            setCoverImageId(coverImg.id);
            const coverIndex = sortedImages.findIndex(img => img.id === coverImg.id);
            setCoverImageIndex(coverIndex >= 0 ? coverIndex : 0);
          }
        }
      } else {
        // Reset form for new property
        setFormData({
          title: '',
          description: '',
          price: '',
          address: '',
          city: '',
          state: '',
          country: '',
          zip_code: '',
          type: '',
          bedrooms: '',
          bathrooms: '',
          sq_meters: '',
          year_built: '',
          lat: '',
          lng: '',
          operation_status: 'buy',
        });
        setSelectedFeatures([]);
        setUploadedImages([]);
        setNewImagePreviews([]);
        setExistingImages([]);
        setExistingImageIds([]);
        setCoverImageId(null);
        setCoverImageIndex(0);
      }
      
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, editingProperty]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxImages = 15 - uploadedImages.length;
    
    if (files.length + uploadedImages.length > 15) {
      setError(`Maximum 15 images allowed. You can add ${maxImages} more.`);
      return;
    }

    const newFiles = files.slice(0, maxImages);
    setUploadedImages(prev => [...prev, ...newFiles]);

    // Create previews for new images only
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index: number) => {
    const imageUrlToRemove = existingImages[index];
    const imageIdToRemove = existingImageIds[index];
    setExistingImages(prev => prev.filter((_, i) => i !== index));
    setExistingImageIds(prev => prev.filter((_, i) => i !== index));
    setRemovedExistingImages(prev => [...prev, imageUrlToRemove]);
    
    // Reset cover image if it was the one being removed
    if (coverImageId === imageIdToRemove) {
      setCoverImageId(null);
      setCoverImageIndex(0);
    }
  };

  const handleSetCoverImage = (index: number) => {
    const imageId = existingImageIds[index];
    setCoverImageIndex(index);
    setCoverImageId(imageId);
  };

  const handleOpenLightbox = (imageUrl: string) => {
    setLightboxImage(imageUrl);
  };

  const handleCloseLightbox = () => {
    setLightboxImage(null);
  };

  const uploadImages = async (propertyId: string) => {
    if (uploadedImages.length === 0) {
      setUploadProgress(0);
      return;
    }

    setIsUploadingImages(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < uploadedImages.length; i++) {
        const file = uploadedImages[i];
        
        console.log(`📤 Uploading image ${i + 1}/${uploadedImages.length}: ${file.name}`);
        
        // Step 1: Upload file to blob storage
        const blobFormData = new FormData();
        blobFormData.append('file', file);
        blobFormData.append('bucket', 'property-images');

        const blobResponse = await fetch('/api/blobs/upload', {
          method: 'POST',
          body: blobFormData,
        });

        if (!blobResponse.ok) {
          console.error(`❌ Failed to upload image ${i + 1} to blob storage`);
          continue;
        }

        const blobData = await blobResponse.json();
        const imageUrl = blobData.url || blobData.publicUrl;
        
        console.log(`✅ Image ${i + 1} uploaded to blob storage:`, imageUrl);

        // Step 2: Register image in database with blob URL
        const dbResponse = await fetch('/api/properties/images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            property_id: propertyId,
            image_url: imageUrl,
            is_cover: i === 0,
            display_order: i,
          }),
        });

        if (!dbResponse.ok) {
          console.error(`❌ Failed to register image ${i + 1} in database`);
          continue;
        }

        const imageData = await dbResponse.json();
        console.log(`✅ Image ${i + 1} registered in database:`, imageData.id);

        // Update progress
        const progress = Math.round(((i + 1) / uploadedImages.length) * 100);
        setUploadProgress(progress);
      }

      console.log('🎉 All images uploaded successfully');
      setUploadProgress(0);
    } catch (err) {
      console.error('❌ Error uploading images:', err);
      setUploadProgress(0);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const deleteRemovedImages = async () => {
    if (removedExistingImages.length === 0) {
      return;
    }

    try {
      // Get property images to find their IDs
      if (editingProperty?.images) {
        for (const imageUrl of removedExistingImages) {
          const imageRecord = editingProperty.images.find(img => img.image_url === imageUrl);
          if (imageRecord) {
            console.log(`🗑️ Deleting image ${imageRecord.id}`);
            const deleteResponse = await fetch(`/api/properties/images/${imageRecord.id}`, {
              method: 'DELETE',
            });

            if (!deleteResponse.ok) {
              console.error(`❌ Failed to delete image ${imageRecord.id}`);
            } else {
              console.log(`✅ Image ${imageRecord.id} deleted successfully`);
            }
          }
        }
      }
    } catch (err) {
      console.error('❌ Error deleting images:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.address || !formData.city) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      const propertyPayload = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        zip_code: formData.zip_code,
        type: formData.type,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        sq_meters: parseInt(formData.sq_meters) || 0,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
        operation_status_id: formData.operation_status === 'rent' ? 2 : 1,
        feature_ids: selectedFeatures,
      };

      // Add seller_id only when creating new property
      if (!isEditMode) {
        (propertyPayload as any).seller_id = (session?.user as any)?.sub || session?.user?.email;
      }

      // Create or update property
      const method = isEditMode ? 'PUT' : 'POST';
      const endpoint = isEditMode ? `/api/properties/${editingProperty?.id}` : '/api/properties';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyPayload),
      });

      if (!response.ok) {
        throw new Error(isEditMode ? 'Failed to update property' : 'Failed to create property');
      }

      const property = await response.json();
      const propertyId = property.id || editingProperty?.id;
      
      // Delete removed images if editing
      if (isEditMode && removedExistingImages.length > 0) {
        await deleteRemovedImages();
      }
      
      // Upload new images if any
      if (uploadedImages.length > 0) {
        await uploadImages(propertyId);
      }

      // Set cover image if one was selected
      if (isEditMode && coverImageId) {
        try {
          const setCoverResponse = await fetch('/api/properties/images/set-cover', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageId: coverImageId,
              propertyId: propertyId,
            }),
          });
          
          if (!setCoverResponse.ok) {
            console.error('Failed to set cover image');
          }
        } catch (err) {
          console.error('Error setting cover image:', err);
        }
      }

      setSuccess(true);
      
      // Reset form and images
      setFormData({
        title: '',
        description: '',
        price: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zip_code: '',
        type: '',
        bedrooms: '',
        bathrooms: '',
        sq_meters: '',
        year_built: '',
        lat: '',
        lng: '',
        operation_status: 'buy',
      });
      setUploadedImages([]);
      setNewImagePreviews([]);
      setExistingImages([]);
      setExistingImageIds([]);
      setRemovedExistingImages([]);
      setCoverImageId(null);
      setCoverImageIndex(0);

      // Call appropriate callback
      if (isEditMode && onPropertyUpdated) {
        onPropertyUpdated(propertyId);
      } else if (!isEditMode && onPropertyCreated) {
        onPropertyCreated(propertyId);
      }

      // Close after success
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : (isEditMode ? 'Failed to update property' : 'Failed to create property'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.addPropertyOverlay} onClick={onClose}>
      <div className={styles.addPropertyModal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className={styles.modalHeader}>
          <h2>{isEditMode ? '✏️ Edit Property' : '➕ Add New Property'}</h2>
          <p>{isEditMode ? 'Update the property details' : 'Fill in the details to list your property'}</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className={styles.successBanner}>
            <span>{isEditMode ? '✅ Property updated successfully!' : '✅ Property created successfully!'}</span>
          </div>
        )}

        {/* Upload Progress */}
        {isUploadingImages && uploadProgress > 0 && (
          <div className={styles.uploadProgressContainer}>
            <p>📤 Uploading images... ({uploadProgress}%)</p>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={styles.errorBanner}>
            <span className={styles.errorIcon}>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.addPropertyForm}>
          {/* Basic Info Section */}
          <div className={styles.formSection}>
            <h3>Basic Information</h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="e.g., Beautiful Modern Apartment"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe your property..."
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                >
                  <option value="">Select Type</option>
                  {propertyTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="price">Price *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  placeholder="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="operation_status">Operation *</label>
                <select
                  id="operation_status"
                  name="operation_status"
                  value={formData.operation_status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Operation</option>
                  <option value="buy">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className={styles.formSection}>
            <h3>Location</h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="address">Address *</label>
              <input
                type="text"
                id="address"
                name="address"
                placeholder="Street address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="state">State</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="zip_code">Zip Code</label>
                <input
                  type="text"
                  id="zip_code"
                  name="zip_code"
                  placeholder="Zip Code"
                  value={formData.zip_code}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className={styles.formSection}>
            <h3>Property Details</h3>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="bedrooms">Bedrooms</label>
                <input
                  type="number"
                  id="bedrooms"
                  name="bedrooms"
                  placeholder="0"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="bathrooms">Bathrooms</label>
                <input
                  type="number"
                  id="bathrooms"
                  name="bathrooms"
                  placeholder="0"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="sq_meters">Square Meters</label>
                <input
                  type="number"
                  id="sq_meters"
                  name="sq_meters"
                  placeholder="0"
                  value={formData.sq_meters}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="year_built">Year Built</label>
                <input
                  type="number"
                  id="year_built"
                  name="year_built"
                  placeholder="e.g., 2020"
                  value={formData.year_built}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Coordinates Section */}
          <div className={styles.formSection}>
            <h3>📍 Coordinates (Optional)</h3>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="lat">Latitude</label>
                <input
                  type="number"
                  id="lat"
                  name="lat"
                  placeholder="e.g., -34.6037"
                  step="0.0001"
                  value={formData.lat}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="lng">Longitude</label>
                <input
                  type="number"
                  id="lng"
                  name="lng"
                  placeholder="e.g., -58.3816"
                  step="0.0001"
                  value={formData.lng}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className={styles.formSection}>
            <h3>✨ Property Features</h3>
            
            <div className={styles.featuresGrid}>
              {availableFeatures.length > 0 ? (
                availableFeatures.map((feature) => (
                  <div key={feature.id} className={styles.featureCheckbox}>
                    <input
                      type="checkbox"
                      id={`feature-${feature.id}`}
                      checked={selectedFeatures.includes(feature.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFeatures([...selectedFeatures, feature.id]);
                        } else {
                          setSelectedFeatures(selectedFeatures.filter(id => id !== feature.id));
                        }
                      }}
                    />
                    <label htmlFor={`feature-${feature.id}`}>
                      <span className={styles.featureName}>{feature.name}</span>
                      {feature.category && <span className={styles.featureCategory}>{feature.category}</span>}
                    </label>
                  </div>
                ))
              ) : (
                <p className={styles.noFeatures}>Loading features...</p>
              )}
            </div>
          </div>

          {/* Images Section */}
          <div className={styles.formSection}>
            <h3>📷 Property Photos</h3>
            
            {/* All Images Display - Show thumbnails of all images when editing */}
            {isEditMode && (existingImages.length > 0 || newImagePreviews.length > 0) && (
              <div className={styles.existingImagesContainer}>
                <h4>All Images ({existingImages.length + newImagePreviews.length})</h4>
                <div className={styles.imagePreviewGrid}>
                  {/* Existing Images */}
                  {existingImages.map((imageUrl, index) => (
                    <div key={`existing-${index}`} className={styles.imagePreviewItem}>
                      <img 
                        src={imageUrl} 
                        alt={`Existing ${index + 1}`}
                        onClick={() => handleOpenLightbox(imageUrl)}
                        style={{ cursor: 'pointer' }}
                      />
                      <button
                        type="button"
                        className={styles.removeImageButton}
                        onClick={() => handleRemoveExistingImage(index)}
                        title="Remove image"
                      >
                        ✕
                      </button>
                      <button
                        type="button"
                        className={styles.setCoverButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetCoverImage(index);
                        }}
                        title={coverImageId === existingImageIds[index] ? 'This is the cover image' : 'Set as cover image'}
                      >
                        {coverImageId === existingImageIds[index] ? '⭐' : '☆'}
                      </button>
                      {coverImageId === existingImageIds[index] && <div className={styles.coverBadge}>COVER</div>}
                    </div>
                  ))}
                  
                  {/* New Images */}
                  {newImagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className={styles.imagePreviewItem}>
                      <img src={preview} alt={`New ${index + 1}`} />
                      <button
                        type="button"
                        className={styles.removeImageButton}
                        onClick={() => handleRemoveImage(index)}
                        title="Remove image"
                      >
                        ✕
                      </button>
                      <div className={styles.newBadge}>NEW</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className={styles.imageUploadArea}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className={styles.uploadButton}
                onClick={() => fileInputRef.current?.click()}
              >
                <span>📁 Click to upload photos</span>
                <small>Max 15 images ({(existingImages.length + uploadedImages.length)}/15)</small>
              </button>
            </div>

            {/* Only show this for new properties */}
            {!isEditMode && newImagePreviews.length > 0 && (
              <div className={styles.imagePreviewGrid}>
                {newImagePreviews.map((preview, index) => (
                  <div key={index} className={styles.imagePreviewItem}>
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className={styles.removeImageButton}
                      onClick={() => handleRemoveImage(index)}
                      title="Remove image"
                    >
                      ✕
                    </button>
                    {index === 0 && <div className={styles.coverBadge}>COVER</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Property' : 'Create Property')}
            </button>
          </div>
        </form>

        {/* Image Lightbox */}
        {lightboxImage && (
          <div className={styles.lightboxOverlay} onClick={handleCloseLightbox}>
            <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
              <button
                className={styles.lightboxClose}
                onClick={handleCloseLightbox}
                aria-label="Close lightbox"
              >
                ✕
              </button>
              <img src={lightboxImage} alt="Full size preview" className={styles.lightboxImage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddPropertyPopup;
