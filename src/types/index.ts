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

export interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
  is_cover: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyOperationStatus {
  id: number;
  name: string;
  display_name: string;
  description: string;
  created_at?: string;
}

export interface Property {
  id: number;
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
  property_type: PropertyType;
  property_status: PropertyStatus;
  features: PropertyFeature[];
  images: PropertyImage[];
  state?: string;
  country?: string;
  zip_code?: string;
  year_built?: number;
  created_at?: string;
  updated_at?: string;
  seller_id?: string;
  operation_status_id?: number;
}

export interface PropertyFormData {
  id: number;
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
}
