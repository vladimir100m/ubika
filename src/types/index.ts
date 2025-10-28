export type SearchBarProps = {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export type BannerProps = {
  title: string;
};

export interface Geocode {
  lat: number;
  lng: number;
}

export interface PropertyType {
  id: number;
  name: string;
  display_name: string;
}

export interface PropertyStatus {
  id: number;
  name: string;
  display_name: string;
  color: string;
}

export interface PropertyFeature {
  id: number;
  name: string;
  category?: string;
  icon?: string;
}

export interface Neighborhood {
  id: number;
  name: string;
  description: string;
  subway_access: string;
  dining_options: string;
  shopping_access: string;
  highway_access: string;
}

/**
 * Unified media interface replaces PropertyImage and PropertyMedia
 * media_type defaults to 'image' for backward compatibility
 */
export interface PropertyMedia {
  id: string;
  property_id: string;
  media_type: 'image' | 'video' | 'document' | string;
  url: string;
  storage_key?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  checksum?: string;
  // Image-specific metadata
  width?: number;
  height?: number;
  alt_text?: string;
  // Presentation
  is_primary: boolean;
  display_order: number;
  // Timestamps
  created_at: string;
  updated_at: string;
  uploaded_at: string;
  // Backward compatibility mapped fields
  image_url?: string;
  is_cover?: boolean;
}

// Backward compatibility alias
export type PropertyImage = PropertyMedia;

export interface PropertyOperationStatus {
  id: number;
  name: string;
  display_name: string;
  description: string;
  created_at?: string;
}

export interface Property {
  id: string | number;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  // keep both naming conventions used across the codebase
  squareMeters?: number;
  sq_meters?: number;
  lat?: number | null;
  lng?: number | null;
  property_type: PropertyType;
  property_status: PropertyStatus;
  features: PropertyFeature[];
  images: PropertyImage[];
  state?: string;
  country?: string;
  zip_code?: string;
  yearbuilt?: number | null;
  year_built?: number | null;
  created_at?: string;
  updated_at?: string;
  seller_id?: string;
  operation_status_id?: number;
}

export interface PropertyFormData {
  id?: string | number;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  sq_meters: number;
  lat: number;
  lng: number;
  property_type_id: number;
  property_status_id: number;
  features: number[];
  images: PropertyImage[];
  // Optional additional address/metadata fields used in forms
  state?: string;
  country?: string;
  zip_code?: string;
  seller_id?: string;
}
