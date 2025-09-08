import { Property, PropertyImage } from '../types';

// Fallback neutral placeholder (avoid type-based stock photos for now)
export const FALLBACK_IMAGE = '/ubika-logo.png';

// Sort images placing cover first, then by display_order.
export function sortPropertyImages(images: PropertyImage[]): PropertyImage[] {
  return [...images].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return a.display_order - b.display_order;
  });
}

// Return the best cover image for a property.
export function getCoverImage(property: Property): string {
  if (property.images && property.images.length > 0) {
    const sorted = sortPropertyImages(property.images);
    return sorted[0].image_url;
  }
  if (property.image_url) return property.image_url;
  return FALLBACK_IMAGE;
}

// Return up to `limit` images (after sorting). If no images, fallback to single placeholder.
export function getPropertyImages(property: Property, limit = 3): string[] {
  if (property.images && property.images.length > 0) {
    return sortPropertyImages(property.images)
      .slice(0, limit)
      .map(img => img.image_url);
  }
  if (property.image_url) return [property.image_url];
  return [FALLBACK_IMAGE];
}

// Return all images (sorted) or a fallback single image.
export function getAllPropertyImages(property: Property): string[] {
  if (property.images && property.images.length > 0) {
    return sortPropertyImages(property.images).map(img => img.image_url);
  }
  if (property.image_url) return [property.image_url];
  return [FALLBACK_IMAGE];
}
