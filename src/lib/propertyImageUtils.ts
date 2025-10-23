/**
 * Centralized Property Image Utilities
 * Single source of truth for all image-related logic
 * Note: This is sync-focused for use in components; async resolution happens at fetch layer
 */

import { Property, PropertyImage } from '../types';

export const FALLBACK_IMAGE = '/ubika-logo.png';

/**
 * Sort property images by cover status and display order
 * Used internally and by callers
 */
export function sortPropertyImages(images: PropertyImage[]): PropertyImage[] {
  return [...images].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return a.display_order - b.display_order;
  });
}

/**
 * Get the primary cover image URL for a property
 * Returns the raw URL (assuming it's already resolved from API)
 * Use with useResolvedImage hook for async resolution in client
 */
export function getCoverImageRaw(property: Property | null | undefined): string {
  if (!property?.images || property.images.length === 0) {
    return FALLBACK_IMAGE;
  }

  const sorted = sortPropertyImages(property.images);
  return sorted[0]?.image_url ?? FALLBACK_IMAGE;
}

/**
 * Get multiple property image URLs (default limit: 3)
 * Returns raw URLs for thumbnail previews
 */
export function getPropertyImagesRaw(property: Property | null | undefined, limit = 3): string[] {
  if (!property?.images || property.images.length === 0) {
    return [FALLBACK_IMAGE];
  }

  return sortPropertyImages(property.images)
    .slice(0, limit)
    .map(img => img.image_url ?? FALLBACK_IMAGE);
}

/**
 * Get all property image URLs (no limit)
 * Returns raw URLs for full gallery display
 */
export function getAllPropertyImagesRaw(property: Property | null | undefined): string[] {
  if (!property?.images || property.images.length === 0) {
    return [FALLBACK_IMAGE];
  }

  return sortPropertyImages(property.images).map(img => img.image_url ?? FALLBACK_IMAGE);
}

/**
 * Check if property has valid images
 */
export function hasValidImages(property: Property | null | undefined): boolean {
  return !!property?.images && property.images.length > 0;
}

/**
 * Get image count for property
 */
export function getImageCount(property: Property | null | undefined): number {
  return property?.images?.length ?? 0;
}

/**
 * Get cover image object (not URL)
 * Useful for operations on the image record itself
 */
export function getCoverImageObject(property: Property | null | undefined): PropertyImage | null {
  if (!property?.images || property.images.length === 0) {
    return null;
  }

  const sorted = sortPropertyImages(property.images);
  return sorted[0] ?? null;
}
