import React, { useState, useRef, useEffect, DragEvent, forwardRef, useImperativeHandle } from 'react';
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
  allowTempImagesBeforeSave?: boolean; // kept for backward compatibility (currently not staging temps)
  onAutoCreateProperty?: () => Promise<number | string>; // (legacy) optional auto-create hook (not used when staging)
  onPropertyCreated?: (id: number | string) => void; // notify parent of new id
}

interface UploadItem {
  tempId: string;
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  file?: File;
}

const PropertyImageEditor = forwardRef<any, PropertyImageEditorProps>(({ 
  propertyId,
  sellerId,
  images,
  onChange,
  maxImages = 15,
  allowBulkOperations = true,
  showImagePreview = true,
  allowTempImagesBeforeSave = false,
  onAutoCreateProperty,
  onPropertyCreated
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creatingProperty, setCreatingProperty] = useState(false);
  const stagedUploadedRef = useRef(false); // prevent double auto upload

  // Keep internal copy of staged temp images (for preview before real upload)
  const [tempImages, setTempImages] = useState<PropertyImage[]>([]);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [previewImage, setPreviewImage] = useState<PropertyImage | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load images when propertyId changes to ensure all associated images are loaded
  useEffect(() => {
    if (!propertyId) return;
    const controller = new AbortController();
    loadAllPropertyImages(controller.signal as AbortSignal).catch(() => {});
    return () => controller.abort();
  }, [propertyId]);

  const loadAllPropertyImages = async (signal?: AbortSignal) => {
    if (!propertyId) return;
    try {
      const response = await fetch(`/api/properties/images/${propertyId}`, signal ? { signal } : undefined as any);
      if (response.ok) {
        const result = await response.json();
        const loadedImages = result.images || [];
        
        // Only update if the images are different from current state
        if (JSON.stringify(loadedImages) !== JSON.stringify(images)) {
          onChange(loadedImages);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading property images:', error);
    }
  };

  const sortedImages = [...images].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return a.display_order - b.display_order;
  });

  // Revoke object URLs created for temp previews when they are removed or on unmount
  useEffect(() => {
    // Capture current tempImages for cleanup when they are replaced or on unmount
    const currentTemp = tempImages.slice();
    return () => {
      currentTemp.forEach(img => {
        try {
          if (img.image_url && img.image_url.startsWith('blob:')) {
            URL.revokeObjectURL(img.image_url);
          }
        } catch (e) {
          // ignore
        }
      });
    };
  }, [tempImages]);

  // File upload handlers
  const triggerFileSelect = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    uploadFiles(e.target.files);
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

  // Allow keyboard activation of the drop zone (Enter/Space)
  const onDropZoneKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerFileSelect();
    }
  };

  // Upload functionality
  const uploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    // Client-side validation: only accept image files and enforce max size (10MB)
    const filesArray = Array.from(fileList);
    const MAX_BYTES = 10 * 1024 * 1024; // 10MB
    const allowedFiles = filesArray.filter(f => f.type?.startsWith('image/') && f.size <= MAX_BYTES);
    const rejected = filesArray.length - allowedFiles.length;
    if (rejected > 0) {
      setLocalError('Some files were skipped: only image files under 10MB are accepted.');
      // continue with allowedFiles if any
      if (allowedFiles.length === 0) return;
    }

    // STAGING MODE: If property doesn't yet exist and allowed -> stage files, create temp previews, wait for property creation
    if (!propertyId && allowTempImagesBeforeSave) {
      const remainingSlots = maxImages - (images.length + tempImages.length);
      if (remainingSlots <= 0) {
        setLocalError(`Maximum ${maxImages} images allowed`);
        return;
      }
      const files = allowedFiles.slice(0, remainingSlots);
      const now = Date.now();
      const newUploadItems = files.map((file, idx) => ({
        tempId: `${now}-${Math.random()}`,
        name: file.name,
        progress: 0,
        status: 'pending' as const,
        file,
      }));
      setUploadItems(prev => [...prev, ...newUploadItems]);
      // Create temporary preview images
      const startOrder = images.length + tempImages.length;
      const newTemp: PropertyImage[] = files.map((file, i) => ({
        id: -(now + i),
        property_id: 0,
        image_url: URL.createObjectURL(file),
        is_cover: (images.length + tempImages.length === 0) && i === 0,
        display_order: startOrder + i + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      setTempImages(prev => [...prev, ...newTemp]);
      onChange([...images, ...tempImages, ...newTemp]);
      return; // do not upload yet
    }

    if (!propertyId) {
      setLocalError('Property must be saved before uploading images');
      return;
    }

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setLocalError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const files = allowedFiles.slice(0, remainingSlots);
    setUploading(true);
    setLocalError(null);

    // Initialize upload items
    const newUploadItems: UploadItem[] = files.map(file => ({
      tempId: `${Date.now()}-${Math.random()}`,
      name: file.name,
      progress: 0,
      status: 'pending',
      file
    }));

    setUploadItems(newUploadItems);

    try {
      const uploadResults: PropertyImage[] = [];

      // Upload files one by one for better progress tracking
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadItem = newUploadItems[i];

        try {
          // Update status to uploading
          setUploadItems(prev => prev.map(item => 
            item.tempId === uploadItem.tempId 
              ? { ...item, status: 'uploading' as const, progress: 50 }
              : item
          ));

          const formData = new FormData();
          formData.append('property_id', String(propertyId));
          formData.append('seller_id', sellerId || 'anonymous');
          formData.append('images', file);

          const response = await fetch('/api/properties/images/upload', {
            method: 'POST',
            body: formData
          });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || 'Upload failed');
            }

            const result = await response.json();
            
            // Update progress to 100% and status to done
            setUploadItems(prev => prev.map(item => 
              item.tempId === uploadItem.tempId 
                ? { ...item, progress: 100, status: 'done' as const }
                : item
            ));

            if (result.images && result.images.length > 0) {
              uploadResults.push(...result.images);
            }

        } catch (error) {
          // Update status to error
          setUploadItems(prev => prev.map(item => 
            item.tempId === uploadItem.tempId 
              ? { 
                  ...item, 
                  status: 'error' as const, 
                  error: error instanceof Error ? error.message : 'Upload failed'
                }
              : item
          ));
        }
      }

      // Reload all images to ensure consistency
      if (uploadResults.length > 0) {
        await loadAllPropertyImages();
      }

    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      // Clear upload items after 3 seconds
      setTimeout(() => setUploadItems([]), 3000);
    }
  };

  // Imperative handle to allow parent to trigger staged upload after property creation
  useImperativeHandle(ref, () => ({
    uploadStaged: async () => {
      if (!propertyId) return;
      const staged = uploadItems.filter(i => i.status === 'pending' && i.file);
      if (staged.length === 0) return;
      setUploading(true);
      for (const item of staged) {
        try {
          setUploadItems(prev => prev.map(u => u.tempId === item.tempId ? { ...u, status: 'uploading', progress: 50 } : u));
          const formData = new FormData();
          formData.append('property_id', String(propertyId));
          formData.append('seller_id', sellerId || 'anonymous');
          formData.append('images', item.file as File);
          const response = await fetch('/api/properties/images/upload', { method: 'POST', body: formData });
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Upload failed');
          }
          await response.json();
          setUploadItems(prev => prev.map(u => u.tempId === item.tempId ? { ...u, status: 'done', progress: 100 } : u));
        } catch (e: any) {
          setUploadItems(prev => prev.map(u => u.tempId === item.tempId ? { ...u, status: 'error', error: e?.message || 'Upload failed' } : u));
        }
      }
      // Reload real images & clear temps
      await loadAllPropertyImages();
      setTempImages([]);
      setUploading(false);
      setTimeout(() => setUploadItems([]), 3000);
    }
  }));

  // Auto-upload staged files once propertyId becomes available
  useEffect(() => {
    if (propertyId && allowTempImagesBeforeSave && uploadItems.some(i => i.status === 'pending') && !stagedUploadedRef.current) {
      stagedUploadedRef.current = true;
      (async () => {
        try { await (ref as any)?.current?.uploadStaged?.(); } catch(e) { /* ignore */ }
      })();
    }
  }, [propertyId, allowTempImagesBeforeSave, uploadItems]);

  // Image operations
  const setCoverImage = async (imageId: number) => {
    if (!propertyId) return;

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

    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Failed to delete image');
    }
  };

  // Bulk selection/deletion removed: deletion is only available via preview modal now

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

  // Note: image reordering removed — moveImage no longer present

  return (
    <div className={styles.container}>
      {/* Upload Zone */}
      <div
        className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''} ${uploading ? styles.uploading : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={triggerFileSelect}
        onKeyDown={onDropZoneKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Upload property images"
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
              <p>Uploading images...</p>
              {creatingProperty && <p>Creating property...</p>}
            </>
          ) : (
            <>
              <div className={styles.uploadIcon}>📸</div>
              <p><strong>Drop images here</strong> or click to browse</p>
              <p className={styles.uploadHint}>
                Up to {maxImages} images • Max 10MB each
              </p>
              {!propertyId && allowTempImagesBeforeSave && (
                <p className={styles.uploadHint}>Images are staged and will upload after saving the property.</p>
              )}
            </>
          )}
        </div>
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
  {uploadItems.length > 0 && (
        <div className={styles.uploadProgress}>
          <h4 className={styles.progressTitle}>Upload Progress</h4>
          {uploadItems.map(item => (
            <div key={item.tempId} className={styles.progressItem}>
              <div className={styles.progressInfo}>
                <span className={styles.fileName}>{item.name}</span>
                <span className={styles.progressStatus}>
      {item.status === 'error' && <span className={styles.statusError}>❌ {item.error}</span>}
      {item.status === 'done' && <span className={styles.statusSuccess}>✅ Done</span>}
      {item.status === 'uploading' && <span>{item.progress}%</span>}
      {item.status === 'pending' && !propertyId && allowTempImagesBeforeSave && <span>Staged</span>}
      {item.status === 'pending' && propertyId && <span>Queued</span>}
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
              {images.length} image{images.length !== 1 ? 's' : ''} uploaded
            </h4>
            
            {allowBulkOperations && images.length > 1 && (
              <div className={styles.bulkActions}>
                <div className={styles.imageStats}>
                  <span>To delete an image, open its preview and use the delete action.</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.thumbGrid}>
            {sortedImages.map((image, idx) => (
              <div key={image.id} className={styles.imageItem}>
                
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
                    aria-pressed={image.is_cover}
                    aria-label={image.is_cover ? 'Cover image' : 'Set as cover image'}
                  >
                    ⭐
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
