import { useState, useCallback } from 'react';

interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  blobPath?: string;
  filename?: string;
  size?: number;
  error?: string;
}

interface BatchUploadResult {
  success: boolean;
  results: UploadResult[];
  failedCount: number;
  successCount: number;
}

interface UseImageUploadReturn {
  uploadProgress: UploadProgress;
  uploadSingle: (file: File, propertyId?: string) => Promise<UploadResult>;
  uploadMultiple: (files: File[], propertyId?: string) => Promise<BatchUploadResult>;
  registerImage: (propertyId: string | number, imageData: any) => Promise<any>;
  registerMultipleImages: (propertyId: string | number, imagesData: any[]) => Promise<any>;
  reset: () => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle'
  });

  const reset = useCallback(() => {
    setUploadProgress({ progress: 0, status: 'idle' });
  }, []);

  const uploadSingle = useCallback(async (file: File, propertyId?: string): Promise<UploadResult> => {
    try {
      setUploadProgress({ progress: 0, status: 'uploading' });

      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 10MB.');
      }

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload JPEG, PNG, or WebP images.');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      if (propertyId) {
        formData.append('propertyId', propertyId);
      }
      formData.append('bucket', 'property-images');

      // Upload to blob storage
      const response = await fetch('/api/blobs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      setUploadProgress({ progress: 100, status: 'success' });

      return {
        success: true,
        url: result.url || result.publicUrl,
        blobPath: result.blobPath,
        filename: result.filename || file.name,
        size: result.size || file.size
      };

    } catch (error) {
      setUploadProgress({ 
        progress: 0, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  const uploadMultiple = useCallback(async (files: File[], propertyId?: string): Promise<BatchUploadResult> => {
    const results: UploadResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    setUploadProgress({ progress: 0, status: 'uploading' });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = Math.round(((i + 1) / files.length) * 100);
      
      setUploadProgress({ 
        progress, 
        status: 'uploading' 
      });

      const result = await uploadSingle(file, propertyId);
      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    const finalStatus = failedCount === 0 ? 'success' : failedCount === files.length ? 'error' : 'success';
    setUploadProgress({ progress: 100, status: finalStatus });

    return {
      success: successCount > 0,
      results,
      successCount,
      failedCount
    };
  }, [uploadSingle]);

  const registerImage = useCallback(async (propertyId: string | number, imageData: any) => {
    try {
      const response = await fetch('/api/properties/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: propertyId,
          ...imageData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register image');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to register image');
    }
  }, []);

  const registerMultipleImages = useCallback(async (propertyId: string | number, imagesData: any[]) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: propertyId,
          images: imagesData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register images');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to register images');
    }
  }, []);

  return {
    uploadProgress,
    uploadSingle,
    uploadMultiple,
    registerImage,
    registerMultipleImages,
    reset
  };
};

export default useImageUpload;