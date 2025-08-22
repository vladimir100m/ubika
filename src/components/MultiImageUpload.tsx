import React, { useState, useRef, useCallback, DragEvent } from 'react';
import styles from '../styles/MultiImageUpload.module.css';

interface MultiImageUploadProps {
  images: string[];                 // Current images (base64 or URL)
  onChange: (images: string[], coverIndex: number) => void; // Emits updated images + cover index
  coverIndex: number;               // Which image is the cover (maps to image_url)
  maxImages?: number;               // Limit number of images
  sampleImages?: string[];          // Optional sample images to pick from
}

// Utility to convert a File to a (possibly resized) base64 data URL
const fileToDataUrl = (file: File, maxDimension = 1600, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Resize if needed (client-side compression)
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height >= width && height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(reader.result as string);
        ctx.drawImage(img, 0, 0, width, height);
        // Preserve original mime type if image/* else default jpeg
        const out = canvas.toDataURL(file.type.startsWith('image/') ? file.type : 'image/jpeg', quality);
        resolve(out);
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  images,
  onChange,
  coverIndex,
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

  const triggerFile = () => inputRef.current?.click();

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    setLocalError(null);
    const files = Array.from(fileList).slice(0, maxImages - images.length); // respect max
    const newImages: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setLocalError('One or more files were not images and were skipped.');
        continue;
      }
      // Hard size cap 8MB before processing
      if (file.size > 8 * 1024 * 1024) {
        setLocalError('Some images exceeded 8MB and were skipped.');
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        newImages.push(dataUrl);
      } catch (e) {
        console.warn('Failed to process image', e);
      }
    }
    if (newImages.length > 0) {
      const merged = [...images, ...newImages];
      // If no cover chosen yet, pick first image (index 0)
      const newCover = merged[coverIndex] ? coverIndex : 0;
      onChange(merged, newCover);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // reset input so selecting same file re-triggers
    if (e.target) e.target.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };
  const onDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragOver(false); };

  const setCover = (idx: number) => { onChange(images, idx); };
  const removeImage = (idx: number) => {
    const updated = images.filter((_, i) => i !== idx);
    let newCover = coverIndex;
    if (idx === coverIndex) newCover = 0; // reset to first
    else if (idx < coverIndex) newCover = coverIndex - 1; // shift left
    onChange(updated, updated.length ? newCover : 0);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const copy = [...images];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    // Recalculate cover index
    let newCover = coverIndex;
    if (from === coverIndex) newCover = to; else if (from < coverIndex && to >= coverIndex) newCover = coverIndex - 1; else if (from > coverIndex && to <= coverIndex) newCover = coverIndex + 1;
    onChange(copy, newCover);
  };

  const handleSample = (url: string) => {
    if (images.length >= maxImages) return;
    const merged = [...images, url];
    const newCover = merged[coverIndex] ? coverIndex : 0;
    onChange(merged, newCover);
  };

  const renderImageItem = useCallback((src: string, idx: number) => {
    const isCover = idx === coverIndex;
    return (
      <div key={idx} className={styles.thumb}>
        <img 
          src={src} 
          alt={`Property image ${idx + 1}`} 
          className={styles.thumbImg} 
          loading="lazy"
          title={`Image ${idx + 1}${isCover ? ' (Cover)' : ''} - Click to view full size`}
        />
        <div className={styles.thumbActions}>
          <button 
            type="button" 
            className={`${styles.smallBtn} ${isCover ? styles.coverBtn : ''}`}
            onClick={() => setCover(idx)} 
            disabled={isCover} 
            title={isCover ? 'Current cover image' : 'Set as cover image'}
          >
            {isCover ? '★ Cover' : 'Set Cover'}
          </button>
          <button 
            type="button" 
            className={styles.smallBtn} 
            onClick={() => move(idx, idx - 1)} 
            disabled={idx === 0}
            title="Move up"
          >
            ↑
          </button>
          <button 
            type="button" 
            className={styles.smallBtn} 
            onClick={() => move(idx, idx + 1)} 
            disabled={idx === images.length - 1}
            title="Move down"
          >
            ↓
          </button>
          <button 
            type="button" 
            className={styles.deleteBtn} 
            onClick={() => removeImage(idx)}
            title="Delete image"
          >
            🗑️
          </button>
        </div>
        {isCover && <div className={styles.coverBadge}>★ Cover Photo</div>}
        <div className={styles.imageNumber}>{idx + 1}</div>
      </div>
    );
  }, [images, coverIndex]);

  return (
    <div className={styles.container}>
      <div 
        className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''}`} 
        onClick={triggerFile}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onFileChange}
          className={styles.hiddenInput}
        />
        <div className={styles.dropContent}>
          <span className={styles.bigIcon}>📷</span>
          <p><strong>Click or Drag & Drop</strong> to add images</p>
          <p className={styles.helper}>JPEG/PNG, up to {maxImages} images. They’re resized client-side.</p>
        </div>
      </div>

      {localError && <div className={styles.error}>{localError}</div>}

      {images.length > 0 && (
        <div className={styles.gallerySection}>
          <div className={styles.galleryHeader}>
            <h4 className={styles.sectionTitle}>Selected Images</h4>
            <span className={styles.count}>{images.length}/{maxImages}</span>
          </div>
          <div className={styles.thumbGrid}>
            {images.map(renderImageItem)}
          </div>
        </div>
      )}

      {sampleImages?.length > 0 && (
        <div className={styles.samplesSection}>
          <p className={styles.samplesLabel}>Or choose sample images:</p>
          <div className={styles.samplesGrid}>
            {sampleImages.map((url) => (
              <button key={url} type="button" className={styles.sampleBtn} onClick={() => handleSample(url)} disabled={images.length >= maxImages}>
                <img src={url} alt="Sample" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;
