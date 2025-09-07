import React, { useState, useRef, useCallback, useEffect, DragEvent, useImperativeHandle } from 'react';
import { PropertyImage } from '../types';
import styles from '../styles/PropertyImageEditor.module.css';

interface PropertyImageEditorProps {
  propertyId?: number | string;
  sellerId?: string;
  images: PropertyImage[];
  onChange: (images: PropertyImage[]) => void;
  maxImages?: number;
  allowBulkOperations?: boolean;
  showImagePreview?: boolean;
  allowTempImagesBeforeSave?: boolean;
}

interface UploadItem {
  tempId: string;
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  file?: File;
}

function PropertyImageEditor(props: PropertyImageEditorProps) {
  const { propertyId, sellerId, images, onChange, maxImages = 15, allowBulkOperations = true, showImagePreview = true, allowTempImagesBeforeSave = false } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const selectModeRef = useRef<'auto' | 'stage'>('auto');
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [previewImage, setPreviewImage] = useState<PropertyImage | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load images when propertyId changes to ensure all associated images are loaded
  useEffect(() => {
    if (propertyId) {
      loadAllPropertyImages();
    }
  }, [propertyId]);

  const loadAllPropertyImages = async () => {
    if (!propertyId) return;
    
    try {
      const response = await fetch(`/api/properties/images/${propertyId}`);
      if (response.ok) {
        const result = await response.json();
        const loadedImages = result.images || [];
        
        // Only update if the images are different from current state
        if (JSON.stringify(loadedImages) !== JSON.stringify(images)) {
          onChange(loadedImages);
        }
      }
    } catch (error) {
      console.error('Error loading property images:', error);
    }
  };

  const sortedImages = images.sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return a.display_order - b.display_order;
  });

  // File upload handlers
  const triggerFileSelect = () => inputRef.current?.click();

  // Trigger file input with explicit mode: 'auto' => upload immediately, 'stage' => stage files for manual upload
  const triggerFileSelectMode = (mode: 'auto' | 'stage' = 'auto') => {
    selectModeRef.current = mode;
    inputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (selectModeRef.current === 'auto') {
      // Immediate upload
      uploadFiles(files);
    } else {
      // Stage files for manual upload
      stageFiles(files);
    }

    if (e.target) e.target.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  // Upload functionality with standardized blob storage
  const uploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    
    // Standardized: Always require propertyId for blob storage uploads
    if (!propertyId) {
      if (allowTempImagesBeforeSave) {
        // Fallback to staging locally if property not yet saved
        stageFiles(fileList);
        return;
      }
      setLocalError('Property must be saved before uploading images to blob storage');
      return;
    }

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setLocalError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const files = Array.from(fileList).slice(0, remainingSlots);
    setUploading(true);
    setLocalError(null);

    // Initialize upload items with standardized tracking
    // Stage then process immediately
    const newUploadItems: UploadItem[] = files.map(file => ({
      tempId: `${Date.now()}-${Math.random()}`,
      name: file.name,
      progress: 0,
      status: 'pending',
      file
    }));

    // Append to any existing staged items
    setUploadItems(prev => [...prev, ...newUploadItems]);

    try {
      // Start processing queue immediately
      await processUploadQueue();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      // Clear upload items after 3 seconds
      setTimeout(() => setUploadItems([]), 3000);
    }
  };

  // Stage files without starting upload (for manual flow)
  const stageFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const remainingSlots = maxImages - images.length - uploadItems.length;
    if (remainingSlots <= 0) {
      setLocalError(`Maximum ${maxImages} images allowed`);
      return;
    }
    const files = Array.from(fileList).slice(0, remainingSlots);
    const newUploadItems: UploadItem[] = files.map(file => ({
      tempId: `${Date.now()}-${Math.random()}`,
      name: file.name,
      progress: 0,
      status: 'pending',
      file
    }));
    setUploadItems(prev => [...prev, ...newUploadItems]);

    // When property not yet saved, create temporary preview images immediately
    if (!propertyId && allowTempImagesBeforeSave) {
      const startingOrder = images.length;
      const tempImages: PropertyImage[] = files.map((file, idx) => ({
        id: -(Date.now() + idx),
        property_id: 0,
        image_url: URL.createObjectURL(file),
        display_order: startingOrder + idx + 1,
        is_cover: images.length === 0 && idx === 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any));
      onChange([...images, ...tempImages]);
    }
  };

  // Process staged uploadItems sequentially
  const processUploadQueue = async () => {
    if (!propertyId) return;
    setUploading(true);
    const results: PropertyImage[] = [];
    // Iterate over a snapshot to avoid state mutation during loop
    for (const item of [...uploadItems]) {
      if (!item.file || item.status !== 'pending') continue;
      // mark uploading
      setUploadItems(prev => prev.map(it => it.tempId === item.tempId ? { ...it, status: 'uploading', progress: 50 } : it));

      try {
        const formData = new FormData();
        formData.append('property_id', String(propertyId));
        formData.append('seller_id', sellerId || 'anonymous');
        formData.append('images', item.file as File);

        const response = await fetch('/api/properties/images/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Upload failed');
        }

        const resJson = await response.json();
        setUploadItems(prev => prev.map(it => it.tempId === item.tempId ? { ...it, progress: 100, status: 'done' } : it));
        if (resJson.images && resJson.images.length > 0) results.push(...resJson.images);
      } catch (err: any) {
        setUploadItems(prev => prev.map(it => it.tempId === item.tempId ? { ...it, status: 'error', error: err?.message || 'Upload failed' } : it));
      }
    }

    if (results.length > 0) {
      await loadAllPropertyImages();
    }
    setUploading(false);
  };


  // Image operations
  const setCoverImage = async (imageId: number) => {
    if (!propertyId) {
      if (allowTempImagesBeforeSave) {
        const updated = images.map(img => ({ ...img, is_cover: img.id === imageId }));
        onChange(updated);
      }
      return;
    }

    try {
      const response = await fetch('/api/properties/images/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [{ imageId, is_cover: true }]
        })
      });

      if (!response.ok) throw new Error('Failed to set cover image');

      // Reload all images to ensure consistency
      await loadAllPropertyImages();

    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Failed to set cover image');
    }
  };

  const deleteImage = async (imageId: number) => {
    if (!propertyId) {
      // For temp images, just remove from state
      const updatedImages = images.filter(img => img.id !== imageId);
      onChange(updatedImages);
      return;
    }

    try {
      const response = await fetch(`/api/properties/images/delete?imageId=${imageId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete image');
      }

      // Reload all images to ensure consistency
      await loadAllPropertyImages();
      
      setSelectedImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });

    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Failed to delete image');
    }
  };

  // Bulk operations
  const selectAllImages = () => {
    setSelectedImages(new Set(images.map(img => img.id)));
  };

  const deselectAllImages = () => {
    setSelectedImages(new Set());
  };

  const deleteSelectedImages = async () => {
    if (selectedImages.size === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedImages.size} selected image${selectedImages.size > 1 ? 's' : ''}?`
    );

    if (!confirmDelete) return;

    for (const imageId of Array.from(selectedImages)) {
      await deleteImage(imageId);
    }
    
    setSelectedImages(new Set());
  };

  // Image selection
  const toggleImageSelection = (imageId: number) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  // Image preview
  const openPreview = (image: PropertyImage) => {
    if (showImagePreview) {
      setPreviewImage(image);
      setShowPreview(true);
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewImage(null);
  };

  // Reorder images
  const moveImage = async (imageId: number, direction: 'left' | 'right') => {
    const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order);
    const currentIndex = sortedImages.findIndex(img => img.id === imageId);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedImages.length) return;

    // Swap positions
    [sortedImages[currentIndex], sortedImages[newIndex]] = [sortedImages[newIndex], sortedImages[currentIndex]];
    
    // Update display_order
    const updatedImages = sortedImages.map((img, idx) => ({
      ...img,
      display_order: idx + 1
    }));

    // Optimistic update
    onChange(updatedImages);

    // Persist to server if property exists
    if (propertyId) {
      try {
        const response = await fetch('/api/properties/images/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: updatedImages.map(img => ({
              imageId: img.id,
              display_order: img.display_order
            }))
          })
        });

        if (!response.ok) throw new Error('Failed to update image order');
        
        // Reload images to ensure consistency
        await loadAllPropertyImages();
        
      } catch (error) {
        setLocalError('Failed to save image order');
        // Reload to revert optimistic update
        await loadAllPropertyImages();
      }
    }
  };

  return (
    <div className={styles.dropZone}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={triggerFileSelect}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={onFileChange}
        className={styles.hiddenInput}
        disabled={uploading || images.length >= maxImages}
      />
      <div className={styles.dropZoneContent}>
        {uploading ? (
          <div>
            <div className={styles.uploadSpinner}></div>
            <p>Uploading to blob storage...</p>
            <p className={styles.uploadHint}>Creating image IDs automatically</p>
          </div>
        ) : (
          <div>
            <div className={styles.uploadIcon}>📸</div>
            <p><strong>Drop images here</strong> or click to browse</p>
            <p className={styles.uploadHint}>
              Standardized blob storage • Automatic ID creation • Up to {maxImages} images • Max 10MB each
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertyImageEditor;
