import { useState, useCallback } from 'react';
import { useImageUpload } from './useImageUpload';

interface PropertyData {
  title: string;
  description?: string;
  price: number;
  address: string;
  city: string;
  state?: string;
  country?: string;
  zip_code?: string;
  type: string;
  bedrooms?: number;
  bathrooms?: number;
  sq_meters?: number;
  year_built?: number;
  [key: string]: any;
}

interface PropertyWithImagesResult {
  success: boolean;
  propertyId?: string | number;
  imagesUploaded?: number;
  imagesFailed?: number;
  error?: string;
}

export const usePropertyWithImages = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { uploadMultiple, registerMultipleImages } = useImageUpload();

  const createPropertyWithImages = useCallback(async (
    propertyData: PropertyData,
    imageFiles: File[]
  ): Promise<PropertyWithImagesResult> => {
    setIsCreating(true);
    setProgress(0);

    try {
      // Step 1: Create property (20% progress)
      setProgress(20);
      const propertyResponse = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData),
      });

      if (!propertyResponse.ok) {
        const errorData = await propertyResponse.json();
        throw new Error(errorData.error || 'Failed to create property');
      }

      const property = await propertyResponse.json();
      const propertyId = property.id;

      // Step 2: Upload images if provided (20% - 80% progress)
      let imagesUploaded = 0;
      let imagesFailed = 0;

      if (imageFiles && imageFiles.length > 0) {
        setProgress(40);
        
        const uploadResult = await uploadMultiple(imageFiles, String(propertyId));
        
        setProgress(60);

        // Step 3: Register successful uploads in database (80% - 90% progress)
        const successfulUploads = uploadResult.results
          .filter(result => result.success)
          .map((result, index) => ({
            image_url: result.url!,
            is_cover: index === 0, // First image is cover
            display_order: index,
            file_size: result.size,
            mime_type: imageFiles[index].type,
            original_filename: result.filename,
            blob_path: result.blobPath,
            alt_text: `${propertyData.title} - Image ${index + 1}`
          }));

        if (successfulUploads.length > 0) {
          setProgress(80);
          await registerMultipleImages(propertyId, successfulUploads);
        }

        imagesUploaded = uploadResult.successCount;
        imagesFailed = uploadResult.failedCount;
        setProgress(90);
      }

      setProgress(100);

      return {
        success: true,
        propertyId,
        imagesUploaded,
        imagesFailed
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      setIsCreating(false);
      setTimeout(() => setProgress(0), 2000); // Reset progress after 2 seconds
    }
  }, [uploadMultiple, registerMultipleImages]);

  return {
    createPropertyWithImages,
    isCreating,
    progress
  };
};

export default usePropertyWithImages;