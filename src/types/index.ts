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

export interface PropertyFormData {
  title: string;
  description: string;
  price: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code?: string;
  type: string;
  rooms: number;
  bathrooms: number;
  squareMeters: number;
  status: string;
  yearBuilt?: number;
  image_url?: string;
  seller_id: string;
  operation_status_id?: number; // 1=Sale, 2=Rent, 3=Not Available
}

export interface Property {
  id: number;
  title: string;
  description: string;
  price: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code?: string;
  type: string;
  rooms: number;
  bathrooms: number;
  squareMeters: number; // Corresponds to 'area' in some parts of the DB/scripts
  image_url: string;
  status: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  yearBuilt?: number;   // Corresponds to 'yearbuilt' in some parts of the DB/scripts
  geocode?: Geocode;
  latitude?: number;  // Often derived from geocode or a separate field
  longitude?: number; // Often derived from geocode or a separate field
  seller_id?: string; // ID of the seller who listed the property
  operation_status_id?: number; // 1=Sale, 2=Rent, 3=Not Available
  operation_status?: string; // Name of the operation status
  operation_status_display?: string; // Display name of the operation status
}

export interface PropertyOperationStatus {
  id: number;
  name: string;
  display_name: string;
  description: string;
  created_at?: string;
}