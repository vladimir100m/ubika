import React, { useState, useRef, useCallback, DragEvent } from 'react';
import { PropertyImage } from '../types';
import styles from '../styles/MultiImageUpload.module.css';

interface MultiImageUploadProps {
  propertyId?: number | string;        // Property ID for API calls (supports both formats)
  sellerId?: string;                   // Seller/User ID for unique path structure
  images: PropertyImage[];             // Current property images from database
  onChange: (images: PropertyImage[]) => void; // Emits updated images
  maxImages?: number;                  // Limit number of images
  sampleImages?: string[];             // Optional sample images to pick from
}

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  propertyId,
  sellerId,
  images,
  onChange,
  maxImages = 10,
  sampleImages = [
    '/properties/casa-moderna.jpg',
    '/properties/apartamento-moderno.jpg',
    '/properties/casa-playa.jpg',
    '/properties/loft-urbano.jpg',
    '/properties/villa-lujo.jpg'
  ]
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const dragImageIdRef = useRef<number | null>(null);

  interface UploadItem {
    tempId: string;
    name: string;
    progress: number; // 0-100
    status: 'pending' | 'uploading' | 'done' | 'error';
    error?: string;
  }

  const triggerFile = () => inputRef.current?.click();

  // Upload files to server
  const uploadFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    if (!propertyId) {
      setLocalError('You must save/create the property before uploading real images. (Use sample images)');
      return;
    }
    // Normalize numeric string IDs to number for consistency
    let normalizedPropertyId: number | string = propertyId;
    if (typeof normalizedPropertyId === 'string' && /^\d+$/.test(normalizedPropertyId)) {
      normalizedPropertyId = parseInt(normalizedPropertyId, 10);
    }

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) return;

    const candidates = Array.from(fileList).slice(0, remainingSlots);
    if (candidates.length === 0) return;

    // Validate & prepare upload items
    const newUploadItems: UploadItem[] = candidates.map(f => ({
      tempId: `${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      name: f.name,
      progress: 0,
      status: 'pending'
    }));
    setUploadItems(prev => [...prev, ...newUploadItems]);
    setLocalError(null);
    setUploading(true);

    // Helper: attempt a single file upload via XHR, with optional migration retry
    const uploadSingle = async (file: File, itemId: string, attempt = 1): Promise<void> => {
      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('property_id', normalizedPropertyId.toString());
        if (sellerId) {
          formData.append('seller_id', sellerId);
        }
        formData.append('images', file);

        xhr.open('POST', '/api/properties/images/upload');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadItems(prev => prev.map(u => u.tempId === itemId ? { ...u, progress: pct, status: 'uploading' } : u));
          }
        };
        xhr.onerror = () => {
            setUploadItems(prev => prev.map(u => u.tempId === itemId ? { ...u, status: 'error', error: 'Network error' } : u));
            resolve();
        };
        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              if (result?.images?.length) {
                onChange([...imagesRef.current, ...result.images]);
              }
              setUploadItems(prev => prev.map(u => u.tempId === itemId ? { ...u, progress: 100, status: 'done' } : u));
            } catch (e) {
              setUploadItems(prev => prev.map(u => u.tempId === itemId ? { ...u, status: 'error', error: 'Bad JSON' } : u));
            }
            resolve();
          } else {
            let serverMsg = 'Upload failed';
            try { serverMsg = JSON.parse(xhr.responseText)?.error || serverMsg; } catch {}
            // Auto-migrate if table missing hint & first attempt
            if (attempt === 1 && /property_images/i.test(xhr.responseText) && /exist|42P01/i.test(xhr.responseText)) {
              try {
                await fetch('/api/migrate/property-images', { method: 'POST' });
                await uploadSingle(file, itemId, 2);
                resolve();
                return;
              } catch (mErr) {
                serverMsg += ' (migration retry failed)';
              }
            }
            setUploadItems(prev => prev.map(u => u.tempId === itemId ? { ...u, status: 'error', error: serverMsg } : u));
            resolve();
          }
        };
        // Begin
        setUploadItems(prev => prev.map(u => u.tempId === itemId ? { ...u, status: 'uploading', progress: 0 } : u));
        xhr.send(formData);
      });
    };

    // Sequential upload to preserve ordering & consistent display_order
  for (let i = 0; i < candidates.length; i++) {
      const file = candidates[i];
      const itemId = newUploadItems[i].tempId;

      // Client-side validation
      if (!file.type.startsWith('image/')) {
        setUploadItems(prev => prev.map(u => u.tempId === itemId ? { ...u, status: 'error', error: 'Not an image' } : u));
        continue;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setUploadItems(prev => prev.map(u => u.tempId === itemId ? { ...u, status: 'error', error: 'File too large (>10MB)' } : u));
        continue;
      }

  await uploadSingle(file, itemId);
    }

    setUploading(false);
    // Remove completed items after short delay
    setTimeout(() => {
      setUploadItems(prev => prev.filter(i => i.status !== 'done'));
    }, 1500);
  };

  // Keep a ref of images for async updates
  const imagesRef = useRef(images);
  React.useEffect(() => { imagesRef.current = images; }, [images]);

  // Handle file selection
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    uploadFiles(e.target.files);
    // Reset input so selecting same file re-triggers
    if (e.target) e.target.value = '';
  };

  // Handle drag and drop
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => { 
    e.preventDefault(); 
    setDragOver(true); 
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => { 
    e.preventDefault(); 
    setDragOver(false); 
  };

  // Set image as cover
  const setCover = async (imageId: number) => {
    if (!propertyId) return;

    try {
      const response = await fetch('/api/properties/images/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [{ imageId, is_cover: true }]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to set cover image');
      }

      // Update local state
      const updatedImages = images.map(img => ({
        ...img,
        is_cover: img.id === imageId
      }));
      onChange(updatedImages);

    } catch (error) {
      console.error('Error setting cover:', error);
      setLocalError(error instanceof Error ? error.message : 'Failed to set cover image');
    }
  };

  // Remove image (server-side if property exists, otherwise local only)
  const removeImage = async (imageId: number) => {
    setLocalError(null);

    // If property not yet created, just remove from local (temporary images / samples)
    if (!propertyId) {
      const updatedTemp = images.filter(img => img.id !== imageId);
      // If deleting cover among temp images, promote first remaining as cover
      const wasCover = images.find(img => img.id === imageId)?.is_cover;
      if (wasCover && updatedTemp.length > 0) {
        updatedTemp[0].is_cover = true;
      }
      onChange(updatedTemp);
      return;
    }

    try {
      const imageToDelete = images.find(i => i.id === imageId);
      const wasCover = imageToDelete?.is_cover;

      const response = await fetch(`/api/properties/images/delete?imageId=${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Failed to delete image');
      }

      // Update local state & ensure a cover still exists locally for UI consistency
      const updatedImages = images.filter(img => img.id !== imageId);
      if (wasCover && updatedImages.length > 0) {
        // Promote first image by display_order as cover optimistically (server does similar)
        const first = [...updatedImages].sort((a,b)=>a.display_order - b.display_order)[0];
        updatedImages.forEach(img => { img.is_cover = img.id === first.id; });
      }
      onChange(updatedImages);

    } catch (error) {
      console.error('Error deleting image:', error);
      setLocalError(error instanceof Error ? error.message : 'Failed to delete image');
    }
  };

  // Reorder images (drag & drop or arrow buttons) - recalculates sequential order
  const reorderImages = async (newOrderList: PropertyImage[]) => {
    onChange(newOrderList); // optimistic
    if (!propertyId) return; // temporary state only
    try {
      const payload = newOrderList.map((img, idx) => ({ imageId: img.id, display_order: idx + 1 }));
      const response = await fetch('/api/properties/images/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: payload })
      });
      if (!response.ok) {
        throw new Error('Failed to persist reorder');
      }
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Reorder failed');
    }
  };

  const moveImage = async (imageId: number, newOrder: number) => {
    const sorted = [...images].sort((a,b)=>a.display_order - b.display_order);
    const targetIdx = sorted.findIndex(i => i.id === imageId);
    if (targetIdx === -1) return;
    const newIdx = Math.max(0, Math.min(sorted.length - 1, newOrder - 1));
    const [removed] = sorted.splice(targetIdx,1);
    sorted.splice(newIdx,0,removed);
    // Reassign sequential display_order
    const reassigned = sorted.map((img, idx) => ({ ...img, display_order: idx + 1 }));
    await reorderImages(reassigned);
  };

  // Drag and drop handlers for individual thumbs
  const onThumbDragStart = (e: React.DragEvent<HTMLDivElement>, imageId: number) => {
    dragImageIdRef.current = imageId;
    e.dataTransfer.effectAllowed = 'move';
  };
  const onThumbDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };
  const onThumbDrop = async (e: React.DragEvent<HTMLDivElement>, targetId: number) => {
    e.preventDefault();
    const sourceId = dragImageIdRef.current;
    dragImageIdRef.current = null;
    if (sourceId == null || sourceId === targetId) return;
    const sorted = [...images].sort((a,b)=>a.display_order - b.display_order);
    const fromIdx = sorted.findIndex(i => i.id === sourceId);
    const toIdx = sorted.findIndex(i => i.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = sorted.splice(fromIdx,1);
    sorted.splice(toIdx,0,moved);
    const reassigned = sorted.map((img, idx) => ({ ...img, display_order: idx + 1 }));
    await reorderImages(reassigned);
  };

  // Add sample image (for properties without ID yet)
  const handleSample = (url: string) => {
    if (!propertyId) {
      // For new properties, add as temporary image
      const tempImage: PropertyImage = {
        id: Date.now(), // Temporary ID
        property_id: 0,
        image_url: url,
        is_cover: images.length === 0,
        display_order: images.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      onChange([...images, tempImage]);
    }
  };

  const renderImageItem = useCallback((image: PropertyImage, idx: number) => {
    const isCover = image.is_cover;
    return (
      <div 
        key={image.id} 
        className={styles.thumb}
        draggable
        onDragStart={(e)=>onThumbDragStart(e,image.id)}
        onDragOver={onThumbDragOver}
        onDrop={(e)=>onThumbDrop(e,image.id)}
      >
        <img 
          src={image.image_url} 
          alt={isCover ? `Cover image ${idx + 1}` : `Property image ${idx + 1}`} 
          className={styles.thumbImg} 
          loading="lazy"
          decoding="async"
          title={`Image ${idx + 1}${isCover ? ' (Cover)' : ''} - Click to view full size`}
        />
        <div className={styles.thumbActions}>
          <button 
            type="button" 
            className={`${styles.smallBtn} ${isCover ? styles.coverBtn : ''}`}
            onClick={() => setCover(image.id)}
            title={isCover ? 'Cover Image' : 'Set as Cover'}
            disabled={uploading}
          >
            ★
          </button>
          {idx > 0 && (
            <button 
              type="button" 
              className={styles.smallBtn}
              onClick={() => moveImage(image.id, image.display_order - 1)}
              title="Move Left"
              disabled={uploading}
            >
              ←
            </button>
          )}
          {idx < images.length - 1 && (
            <button 
              type="button" 
              className={styles.smallBtn}
              onClick={() => moveImage(image.id, image.display_order + 1)}
              title="Move Right"
              disabled={uploading}
            >
              →
            </button>
          )}
          <button 
            type="button" 
            className={`${styles.smallBtn} ${styles.deleteBtn}`}
            onClick={() => removeImage(image.id)}
            title="Delete Image"
            disabled={uploading}
          >
            ✕
          </button>
        </div>
      </div>
    );
  }, [images.length, uploading]);

  return (
    <div className={styles.container}>
      {/* Upload Area */}
      <div 
        className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''} ${uploading ? styles.uploading : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={triggerFile}
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
            </>
          ) : (
            <>
              <div className={styles.uploadIcon}>📸</div>
              <p><strong>Drop images here</strong> or click to browse</p>
              <p className={styles.uploadHint}>
                Up to {maxImages} images • Max 10MB each • JPG, PNG, WebP
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {localError && (
        <div className={styles.errorMessage}>
          {localError}
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className={styles.imageGrid}>
          <h4 className={styles.gridTitle}>
            Property Images ({images.length}/{maxImages}) <span style={{fontWeight:400, fontSize:12}}>Drag to reorder</span>
          </h4>
          <div className={styles.thumbGrid}>
            {images
              .sort((a, b) => a.display_order - b.display_order)
              .map((image, idx) => renderImageItem(image, idx))}
          </div>
        </div>
      )}

      {/* Sample Images */}
      {!propertyId && images.length < maxImages && (
        <div className={styles.sampleSection}>
          <h4 className={styles.sampleTitle}>Quick Start - Choose Sample Images:</h4>
          <div className={styles.sampleGrid}>
            {sampleImages.map((url, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.sampleBtn}
                onClick={() => handleSample(url)}
                disabled={images.length >= maxImages}
              >
                <img src={url} alt={`Sample ${idx + 1}`} className={styles.sampleImg} />
                <span className={styles.sampleLabel}>Add Sample {idx + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Photography Tips */}
      <div className={styles.tips}>
        <h4 className={styles.tipsTitle}>📷 Photography Tips</h4>
        <ul className={styles.tipsList}>
          <li>Use natural lighting when possible</li>
          <li>Take photos from multiple angles</li>
          <li>Include key features (kitchen, bathrooms, living areas)</li>
          <li>Ensure rooms are clean and well-staged</li>
          <li>First image will be used as the cover photo</li>
        </ul>
      </div>

      {/* Upload Progress */}
      {uploadItems.length > 0 && (
        <div style={{marginTop:12}} aria-live="polite">
          {uploadItems.map(item => (
            <div key={item.tempId} style={{display:'flex',alignItems:'center',gap:8, marginBottom:4, fontSize:12}}>
              <span style={{flex:'0 0 140px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.name}</span>
              <div style={{flex:1, background:'#e5e7eb', borderRadius:4, height:6, position:'relative'}}>
                <div style={{position:'absolute',left:0,top:0,height:'100%',width:`${item.progress}%`,background: item.status==='error' ? '#dc2626' : '#3b82f6', borderRadius:4, transition:'width .2s'}} />
              </div>
              <span>{item.status==='error' ? '❌' : `${item.progress}%`}</span>
              {item.error && <span style={{color:'#dc2626'}}> {item.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;
