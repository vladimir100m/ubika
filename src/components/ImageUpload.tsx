import React, { useState, ChangeEvent, useRef } from 'react';
import styles from '../styles/ImageUpload.module.css';

interface ImageUploadProps {
  onImageChange: (imageUrl: string) => void;
  defaultValue?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageChange, defaultValue }) => {
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // For demo purposes, we're simulating an upload by converting to base64
  // In a real app, you would upload to a server or cloud storage
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Check file size (limit to 5MB for this demo)
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Please select an image less than 5MB.');
      setIsUploading(false);
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      setIsUploading(false);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onImageChange(result);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Function to handle use of one of the sample images
  const handleSampleImage = (imageUrl: string) => {
    setPreview(imageUrl);
    onImageChange(imageUrl);
  };

  return (
    <div className={styles.imageUploadContainer}>
      <div 
        className={styles.imagePreviewArea}
        onClick={handleClick}
      >
        {preview ? (
          <img src={preview} alt="Property preview" className={styles.imagePreview} />
        ) : (
          <div className={styles.uploadPlaceholder}>
            <div className={styles.uploadIcon}>📷</div>
            <p>Click to upload property image</p>
          </div>
        )}
        {isUploading && <div className={styles.uploadingOverlay}>Uploading...</div>}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className={styles.fileInput}
      />
      
      <div className={styles.uploadActions}>
        <button 
          type="button" 
          onClick={handleClick}
          className={styles.uploadButton}
        >
          {preview ? 'Change Image' : 'Upload Image'}
        </button>
        
        {preview && (
          <button 
            type="button" 
            onClick={() => {
              setPreview(null);
              onImageChange('');
            }}
            className={styles.removeButton}
          >
            Remove
          </button>
        )}
      </div>
      
      <div className={styles.sampleImagesSection}>
        <p className={styles.sampleImagesLabel}>Or use a sample image:</p>
        <div className={styles.sampleImagesGrid}>
          <div 
            className={styles.sampleImageOption}
            onClick={() => handleSampleImage('/properties/casa-moderna.jpg')}
          >
            <img src="/properties/casa-moderna.jpg" alt="Modern House" />
          </div>
          <div 
            className={styles.sampleImageOption}
            onClick={() => handleSampleImage('/properties/apartamento-moderno.jpg')}
          >
            <img src="/properties/apartamento-moderno.jpg" alt="Modern Apartment" />
          </div>
          <div 
            className={styles.sampleImageOption}
            onClick={() => handleSampleImage('/properties/casa-playa.jpg')}
          >
            <img src="/properties/casa-playa.jpg" alt="Beach House" />
          </div>
          <div 
            className={styles.sampleImageOption}
            onClick={() => handleSampleImage('/properties/loft-urbano.jpg')}
          >
            <img src="/properties/loft-urbano.jpg" alt="Urban Loft" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
