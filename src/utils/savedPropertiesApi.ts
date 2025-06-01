// Utility functions for interacting with saved properties API

export interface SavedProperty {
  id: number;
  title: string;
  description: string;
  price: string;
  address: string;
  city: string;
  state: string;
  country: string;
  type: string;
  rooms: number;
  bathrooms: number;
  squareMeters: number;
  yearBuilt?: number;
  latitude?: number;
  longitude?: number;
  image_url: string;
  status: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  saved_at: string;
}

export interface SavedPropertiesResponse {
  [propertyId: number]: boolean;
}

/**
 * Get all saved properties for the current user
 */
export const getSavedProperties = async (): Promise<SavedProperty[]> => {
  const response = await fetch('/api/properties/saved', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch saved properties');
  }

  return response.json();
};

/**
 * Save a property for the current user
 */
export const saveProperty = async (propertyId: number): Promise<void> => {
  const response = await fetch('/api/properties/saved', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ propertyId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save property');
  }
};

/**
 * Unsave a property for the current user
 */
export const unsaveProperty = async (propertyId: string) => {
  if (!propertyId) {
    throw new Error('Property ID is required');
  }

  const response = await fetch('/api/properties/saved', { // Changed from 'unsave' to 'saved'
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ propertyId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to unsave property');
  }
};

/**
 * Check if specific properties are saved by the current user
 */
export const checkSavedStatus = async (propertyIds: number[]): Promise<SavedPropertiesResponse> => {
  const idsParam = propertyIds.map(id => `propertyIds=${id}`).join('&');
  const response = await fetch(`/api/properties/saved-status?${idsParam}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to check saved status');
  }

  return response.json();
};

/**
 * Toggle save status for a property
 */
export const toggleSaveProperty = async (propertyId: number, isSaved: boolean): Promise<void> => {
  if (isSaved) {
    await unsaveProperty(propertyId.toString());
  } else {
    await saveProperty(propertyId);
  }
};
