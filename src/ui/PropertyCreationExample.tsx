import React, { useState } from 'react';
import { usePropertyWithImages } from '../lib/usePropertyWithImages';
import { useImageUpload } from '../lib/useImageUpload';
import PropertyGalleryEnhanced from './PropertyGalleryEnhanced';

const PropertyCreationExample: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [propertyData, setPropertyData] = useState({
    title: '',
    description: '',
    price: 0,
    address: '',
    city: '',
    type: 'apartment',
    bedrooms: 1,
    bathrooms: 1
  });
  const [createdProperty, setCreatedProperty] = useState<any>(null);

  const { createPropertyWithImages, isCreating, progress } = usePropertyWithImages();
  const { uploadProgress } = useImageUpload();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files.slice(0, 15)); // Limit to 15 images
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!propertyData.title || !propertyData.address) {
      alert('Please fill in required fields');
      return;
    }

    const result = await createPropertyWithImages(propertyData, selectedFiles);

    if (result.success) {
      alert(`Property created successfully! ${result.imagesUploaded} images uploaded.`);
      // Fetch the created property with images for display
      fetchCreatedProperty(result.propertyId!);
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const fetchCreatedProperty = async (propertyId: string | number) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (response.ok) {
        const property = await response.json();
        setCreatedProperty(property);
      }
    } catch (error) {
      console.error('Failed to fetch created property:', error);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Create Property with Images - Complete Workflow Demo</h2>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label>
            Property Title *
            <input
              type="text"
              value={propertyData.title}
              onChange={(e) => setPropertyData(prev => ({ ...prev, title: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>
            Description
            <textarea
              value={propertyData.description}
              onChange={(e) => setPropertyData(prev => ({ ...prev, description: e.target.value }))}
              style={{ width: '100%', padding: '8px', marginTop: '5px', height: '80px' }}
            />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <label>
            Price *
            <input
              type="number"
              value={propertyData.price}
              onChange={(e) => setPropertyData(prev => ({ ...prev, price: Number(e.target.value) }))}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>

          <label>
            Property Type
            <select
              value={propertyData.type}
              onChange={(e) => setPropertyData(prev => ({ ...prev, type: e.target.value }))}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="condo">Condo</option>
              <option value="townhouse">Townhouse</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>
            Address *
            <input
              type="text"
              value={propertyData.address}
              onChange={(e) => setPropertyData(prev => ({ ...prev, address: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <label>
            City *
            <input
              type="text"
              value={propertyData.city}
              onChange={(e) => setPropertyData(prev => ({ ...prev, city: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>

          <label>
            Bedrooms
            <input
              type="number"
              value={propertyData.bedrooms}
              onChange={(e) => setPropertyData(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
              min="0"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>

          <label>
            Bathrooms
            <input
              type="number"
              value={propertyData.bathrooms}
              onChange={(e) => setPropertyData(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
              min="0"
              step="0.5"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>
            Property Images (Max 15)
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
          {selectedFiles.length > 0 && (
            <p style={{ marginTop: '5px', color: '#666' }}>
              {selectedFiles.length} image(s) selected
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isCreating}
          style={{
            backgroundColor: '#0074e4',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            cursor: isCreating ? 'not-allowed' : 'pointer',
            opacity: isCreating ? 0.6 : 1,
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isCreating ? 'Creating Property...' : 'Create Property with Images'}
        </button>

        {(isCreating || progress > 0) && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              Progress: {progress}%
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#0074e4',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}
      </form>

      {createdProperty && (
        <div>
          <h3>Created Property</h3>
          <div style={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: '8px', 
            padding: '20px',
            backgroundColor: '#f9f9f9'
          }}>
            <h4>{createdProperty.title}</h4>
            <p><strong>Price:</strong> ${createdProperty.price?.toLocaleString()}</p>
            <p><strong>Address:</strong> {createdProperty.address}, {createdProperty.city}</p>
            <p><strong>Type:</strong> {createdProperty.type}</p>
            <p><strong>Bedrooms:</strong> {createdProperty.bedrooms} | <strong>Bathrooms:</strong> {createdProperty.bathrooms}</p>
            
            {createdProperty.images && createdProperty.images.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h5>Property Images ({createdProperty.images.length})</h5>
                <PropertyGalleryEnhanced
                  images={createdProperty.images}
                  propertyTitle={createdProperty.title}
                  showThumbnails={true}
                  allowFullscreen={true}
                  priority={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyCreationExample;