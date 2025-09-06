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

const PropertyImageEditor = React.forwardRef(function PropertyImageEditor(
  props: PropertyImageEditorProps,
  ref: React.Ref<any>
) {
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

  // Expose imperative handle to parent components
  useImperativeHandle(ref, () => ({
    // Upload any staged files
    uploadStaged: async () => {
      await processUploadQueue();
    },
    // Open native file picker and immediately upload
    openUploadDialog: () => {
      triggerFileSelectMode('auto');
    },
    // Open native file picker but only stage (requires manual upload later)
    openStageDialog: () => {
      triggerFileSelectMode('stage');
    },
    // Delete currently selected images (no-op if none)
    deleteSelected: () => {
      deleteSelectedImages();
    }
  }));

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
    <div className={styles.container}>
      {/* Upload Zone */}
      <div
        className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''} ${uploading ? styles.uploading : ''}`}
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
            <>
              <div className={styles.uploadSpinner}></div>
              <p>Uploading to blob storage...</p>
              <p className={styles.uploadHint}>Creating image IDs automatically</p>
            </>
          ) : (
            <>
              <div className={styles.uploadIcon}>📸</div>
              <p><strong>Drop images here</strong> or click to browse</p>
              <p className={styles.uploadHint}>
                Standardized blob storage • Automatic ID creation • Up to {maxImages} images • Max 10MB each
              </p>
            </>
          )}
        </div>
      </div>

      {/* Upload Controls: Select & Upload / Select to Stage / Upload Staged / Clear Staged */}
      <div className={styles.uploadControls}>
        <button
          type="button"
          className={styles.controlBtn}
          onClick={() => (propertyId ? triggerFileSelectMode('auto') : triggerFileSelectMode('stage'))}
          disabled={uploading || images.length >= maxImages}
        >
          {propertyId ? '📤 Select & Upload' : '📥 Add Images'}
        </button>

        {propertyId && (
          <button
            type="button"
            className={styles.controlBtn}
            onClick={() => triggerFileSelectMode('stage')}
            disabled={uploading || images.length >= maxImages}
          >
            📥 Select to Stage
          </button>
        )}

        {uploadItems.length > 0 && propertyId && (
          <>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => processUploadQueue()}
              disabled={uploading || !propertyId}
            >
              ⬆️ Upload Staged ({uploadItems.length})
            </button>

            <button
              type="button"
              className={`${styles.controlBtn} ${styles.clearBtn}`}
              onClick={() => { setUploadItems([]); setLocalError(null); }}
              disabled={uploading}
            >
              🧹 Clear Staged
            </button>
          </>
        )}
      </div>

      {/* Error Message */}
      {localError && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          {localError}
          <button 
            className={styles.errorClose}
            onClick={() => setLocalError(null)}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {/* Upload Progress */}
  {uploadItems.length > 0 && propertyId && (
        <div className={styles.uploadProgress}>
          <h4 className={styles.progressTitle}>Upload Progress</h4>
          {uploadItems.map(item => (
            <div key={item.tempId} className={styles.progressItem}>
              <div className={styles.progressInfo}>
                <span className={styles.fileName}>{item.name}</span>
                <span className={styles.progressStatus}>
                  {item.status === 'error' ? (
                    <span className={styles.statusError}>❌ {item.error}</span>
                  ) : item.status === 'done' ? (
                    <span className={styles.statusSuccess}>✅ Done</span>
                  ) : (
                    <span>{item.progress}%</span>
                  )}
                </span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={`${styles.progressFill} ${item.status === 'error' ? styles.progressError : ''}`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className={styles.imageGrid}>
          <div className={styles.gridHeader}>
            <h4 className={styles.gridTitle}>
              📸 {images.length} image{images.length !== 1 ? 's' : ''} {propertyId ? 'in blob storage' : 'staged'}
            </h4>
            
            {allowBulkOperations && images.length > 1 && (
              <div className={styles.bulkActions}>
                <button
                  type="button"
                  className={styles.bulkBtn}
                  onClick={selectedImages.size === images.length ? deselectAllImages : selectAllImages}
                >
                  {selectedImages.size === images.length ? 'Deselect All' : 'Select All'}
                </button>
                
                {selectedImages.size > 0 && (
                  <button
                    type="button"
                    className={`${styles.bulkBtn} ${styles.deleteBtn}`}
                    onClick={deleteSelectedImages}
                  >
                    Delete Selected ({selectedImages.size})
                  </button>
                )}
              </div>
            )}
          </div>

          <div className={styles.thumbGrid}>
            {sortedImages.map((image, idx) => (
              <div key={image.id} className={styles.imageItem}>
                {allowBulkOperations && (
                  <input
                    type="checkbox"
                    className={styles.imageCheckbox}
                    checked={selectedImages.has(image.id)}
                    onChange={() => toggleImageSelection(image.id)}
                  />
                )}
                
                <div 
                  className={styles.imageWrapper}
                  onClick={() => openPreview(image)}
                >
                  <img
                    src={image.image_url}
                    alt={`Property image ${idx + 1}`}
                    className={styles.thumbImg}
                    loading="lazy"
                  />
                  
                  {image.is_cover && (
                    <div className={styles.coverBadge}>Cover</div>
                  )}
                  
                  <div className={styles.imageOverlay}>
                    <button
                      type="button"
                      className={styles.previewBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        openPreview(image);
                      }}
                    >
                      👁️
                    </button>
                  </div>
                </div>

                <div className={styles.imageActions}>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${image.is_cover ? styles.coverBtn : ''}`}
                    onClick={() => setCoverImage(image.id)}
                    title={image.is_cover ? 'Cover Image' : 'Set as Cover'}
                  >
                    ⭐
                  </button>
                  
                  {idx > 0 && (
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => moveImage(image.id, 'left')}
                      title="Move Left"
                    >
                      ←
                    </button>
                  )}
                  
                  {idx < images.length - 1 && (
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => moveImage(image.id, 'right')}
                      title="Move Right"
                    >
                      →
                    </button>
                  )}
                  
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => deleteImage(image.id)}
                    title="Delete Image"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showPreview && previewImage && (
        <div className={styles.previewModal} onClick={closePreview}>
          <div className={styles.previewContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.previewClose}
              onClick={closePreview}
              aria-label="Close preview"
            >
              ×
            </button>
            
            <img
              src={previewImage.image_url}
              alt="Property image preview"
              className={styles.previewImage}
            />
            
            <div className={styles.previewInfo}>
              <h3>Image Details</h3>
              <p><strong>Order:</strong> {previewImage.display_order}</p>
              <p><strong>Cover Image:</strong> {previewImage.is_cover ? 'Yes' : 'No'}</p>
              <p><strong>Uploaded:</strong> {new Date(previewImage.created_at).toLocaleDateString()}</p>
              
              <div className={styles.previewActions}>
                <button
                  className={`${styles.previewActionBtn} ${previewImage.is_cover ? styles.coverBtn : ''}`}
                  onClick={() => {
                    setCoverImage(previewImage.id);
                    closePreview();
                  }}
                >
                  {previewImage.is_cover ? '⭐ Cover Image' : 'Set as Cover'}
                </button>
                
                <button
                  className={`${styles.previewActionBtn} ${styles.deleteBtn}`}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this image?')) {
                      deleteImage(previewImage.id);
                      closePreview();
                    }
                  }}
                >
                  🗑️ Delete Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PropertyImageEditor;
