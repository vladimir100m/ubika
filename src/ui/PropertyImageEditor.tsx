'use client';

import React, { useState, useRef, useEffect, DragEvent, forwardRef, useImperativeHandle } from 'react';
import { PropertyImage } from '../types';
import styles from '../styles/PropertyImageEditor.module.css';

interface PropertyImageEditorProps {
  propertyId?: number | string;
  sellerId?: string;
  initialImages: PropertyImage[];
  onImagesUpdated: (propertyId: string | number) => void;
  maxImages?: number;
  allowBulkOperations?: boolean;
  showImagePreview?: boolean;
  allowTempImagesBeforeSave?: boolean;
  onAutoCreateProperty?: () => Promise<number | string>;
  onPropertyCreated?: (id: number | string) => void;
}

interface UploadItem {
  tempId: string;
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  file?: File;
}

interface TempImage {
  id: string;
  url: string;
  order: number;
  is_cover: boolean;
  file: File;
}

const PropertyImageEditor = forwardRef<any, PropertyImageEditorProps>(({ 
  propertyId,
  sellerId,
  initialImages,
  onImagesUpdated,
  maxImages = 15,
  allowBulkOperations = true,
  showImagePreview = true,
  allowTempImagesBeforeSave = false,
  onAutoCreateProperty,
  onPropertyCreated
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<PropertyImage[]>(initialImages);
  const [tempImages, setTempImages] = useState<TempImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  useImperativeHandle(ref, () => ({
    triggerUpload: () => {
      if (inputRef.current) {
        inputRef.current.click();
      }
    }
  }));

  useEffect(() => {
    const fetchImages = async () => {
      if (propertyId) {
        try {
          const response = await fetch(`/api/properties/${propertyId}/images`);
          if (response.ok) {
            const loadedImages: PropertyImage[] = await response.json();
            setImages(loadedImages);
          }
        } catch (error) {
          console.error('Failed to fetch images:', error);
        }
      }
    };
    fetchImages();
  }, [propertyId]);

  const sortedImages = [...images].sort((a, b) => {
    const orderA = typeof a.display_order === 'number' ? a.display_order : Infinity;
    const orderB = typeof b.display_order === 'number' ? b.display_order : Infinity;
    return orderA - orderB;
  });

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files) {
      handleFileSelect(files);
    }
  };

  const handleFileSelect = (files: FileList) => {
    if (files) {
      const remainingSlots = maxImages - (images.length + tempImages.length);
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      
      if (allowTempImagesBeforeSave) {
        const startOrder = images.length + tempImages.length;
        const newTemp: TempImage[] = filesToProcess.map((file, i) => ({
          id: `temp-${Date.now()}-${i}`,
          url: URL.createObjectURL(file),
          order: startOrder + i,
          is_cover: (images.length + tempImages.length === 0) && i === 0,
          file: file
        }));
        setTempImages(prev => [...prev, ...newTemp]);
      } else {
        addFilesToUploadQueue(filesToProcess);
      }
    }
  };

  const addFilesToUploadQueue = (files: File[]) => {
    const remainingSlots = maxImages - images.length;
    const filesToProcess = files.slice(0, remainingSlots);

    const newUploadItems: UploadItem[] = filesToProcess.map(file => ({
      tempId: `upload-${Date.now()}-${Math.random()}`,
      name: file.name,
      progress: 0,
      status: 'pending',
      file: file
    }));

    setUploadQueue(prev => [...prev, ...newUploadItems]);
  };

  const processUploadQueue = async () => {
    if (uploading) return;
    setUploading(true);

    let currentPropertyId = propertyId;

    if (!currentPropertyId && onAutoCreateProperty) {
      try {
        currentPropertyId = await onAutoCreateProperty();
        if (currentPropertyId && onPropertyCreated) {
          onPropertyCreated(currentPropertyId);
        }
      } catch (error) {
        console.error("Failed to auto-create property:", error);
        setUploading(false);
        return;
      }
    }

    if (!currentPropertyId) {
      console.error("No property ID available for upload.");
      setUploading(false);
      return;
    }

    for (const item of uploadQueue) {
      if (item.status === 'pending' && item.file) {
        await uploadFile(item, currentPropertyId);
      }
    }

    setUploading(false);
    setUploadQueue([]);
  };

  const updateUploadStatus = (tempId: string, status: 'uploading' | 'done' | 'error', progress?: number, error?: string) => {
    setUploadQueue(prev => prev.map(item => 
      item.tempId === tempId ? { ...item, status, progress: progress ?? item.progress, error } : item
    ));
  };

  const uploadFile = async (item: UploadItem, targetPropertyId: number | string) => {
    if (!item.file) return;
    updateUploadStatus(item.tempId, 'uploading', 0);

    const formData = new FormData();
    formData.append('file', item.file);
    formData.append('propertyId', String(targetPropertyId));
    formData.append('sellerId', sellerId || 'anonymous');

    try {
      const response = await fetch('/api/blobs/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newImage: PropertyImage = await response.json();
        setImages(prev => [...prev, newImage]);
        if (targetPropertyId) {
          onImagesUpdated(targetPropertyId);
        }
        updateUploadStatus(item.tempId, 'done');
      } else {
        const errorData = await response.json();
        updateUploadStatus(item.tempId, 'error', undefined, errorData.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      updateUploadStatus(item.tempId, 'error', undefined, 'Network error');
    }
  };

  const handleDelete = async (imageId: number | string) => {
    if (typeof imageId === 'string' && imageId.startsWith('temp-')) {
      setTempImages(prev => prev.filter(img => img.id !== imageId));
      return;
    }

    try {
      const response = await fetch(`/api/blobs/delete?imageId=${imageId}`, { method: 'DELETE' });
      if (response.ok) {
        const updatedImages = images.filter(img => img.id !== imageId);
        setImages(updatedImages);
        if (propertyId) {
          onImagesUpdated(propertyId);
        }
      } else {
        console.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleSetCover = async (imageId: number | string) => {
    if (typeof imageId === 'string' && imageId.startsWith('temp-')) {
      const newCover = tempImages.find(img => img.id === imageId);
      if (!newCover) return;
      
      const updatedTemp = tempImages.map(img => ({ ...img, is_cover: img.id === imageId }));
      const updatedMain = images.map(img => ({ ...img, is_cover: false }));
      
      setTempImages(updatedTemp);
      setImages(updatedMain);
      return;
    }

    try {
      const response = await fetch(`/api/properties/${propertyId}/images/set-cover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      });
      if (response.ok) {
        if (propertyId) {
          onImagesUpdated(propertyId);
        }
      } else {
        console.error('Failed to set cover image');
      }
    } catch (error) {
      console.error('Error setting cover image:', error);
    }
  };

  const handleSetCoverFromFirst = () => {
    const firstImage = sortedImages[0];
    if (firstImage) {
      handleSetCover(firstImage.id);
    }
  };

  return (
    <div className={styles.editorContainer}>
      <div 
        className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          multiple 
          ref={inputRef} 
          onChange={(e) => handleFileSelect(e.target.files!)}
          className={styles.fileInput}
          accept="image/jpeg,image/png,image/webp,image/gif"
        />
        <div className={styles.uploadPrompt}>
          <i className="fas fa-cloud-upload-alt"></i>
          <p>Drag & drop images here, or click to select files</p>
          <button 
            onClick={() => inputRef.current?.click()} 
            className={styles.uploadButton}
            disabled={uploading || (images.length + tempImages.length) >= maxImages}
          >
            <i className="fas fa-upload"></i> Upload Images
          </button>
          <p className={styles.uploadLimits}>Max {maxImages} images</p>
        </div>
      </div>

      {uploadQueue.length > 0 && (
        <div className={styles.uploadQueue}>
          <h4>Upload Queue</h4>
          {uploadQueue.map(item => (
            <div key={item.tempId} className={styles.queueItem}>
              <span>{item.name}</span>
              {item.status === 'uploading' && <div className={styles.progressBar} style={{ width: `${item.progress}%` }}></div>}
              {item.status === 'error' && <span className={styles.errorText}>{item.error}</span>}
            </div>
          ))}
          <button onClick={processUploadQueue} disabled={uploading}>
            {uploading ? 'Uploading...' : `Upload ${uploadQueue.length} files`}
          </button>
        </div>
      )}

      {showImagePreview && (
        <div className={styles.imageGrid}>
          {sortedImages.map(image => (
            <div key={image.id} className={styles.imageWrapper}>
              <img src={image.image_url} alt={`Property image ${image.id}`} className={styles.image} />
              <div className={styles.imageOverlay}>
                <button onClick={() => handleDelete(image.id)}><i className="fas fa-trash"></i></button>
                <button onClick={() => handleSetCover(image.id)} disabled={image.is_cover}><i className="fas fa-star"></i></button>
                {image.is_cover && <span className={styles.coverIndicator}>Cover</span>}
              </div>
            </div>
          ))}
          {tempImages.map(image => (
            <div key={image.id} className={styles.imageWrapper}>
              <img src={image.url} alt={`Temporary image ${image.id}`} className={styles.image} />
              <div className={styles.imageOverlay}>
                <button onClick={() => handleDelete(image.id)}><i className="fas fa-trash"></i></button>
                <button onClick={() => handleSetCover(image.id)} disabled={image.is_cover}><i className="fas fa-star"></i></button>
                {image.is_cover && <span className={styles.coverIndicator}>Cover</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.editorFooter}>
        <div className={styles.imageStats}>
          <span>
            {tempImages.length > 0 
              ? `${tempImages.length} new image${tempImages.length !== 1 ? 's' : ''} ready to upload`
              : `${images.length} image${images.length !== 1 ? 's' : ''} uploaded`
            }
          </span>
          <span>{images.length + tempImages.length} / {maxImages}</span>
        </div>
        {allowBulkOperations && (images.length > 1 || tempImages.length > 1) && (
          <div className={styles.bulkActions}>
            <button onClick={handleSetCoverFromFirst} className={styles.actionButton}>
              <i className="fas fa-star"></i> Set First as Cover
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

PropertyImageEditor.displayName = 'PropertyImageEditor';

export default PropertyImageEditor;
