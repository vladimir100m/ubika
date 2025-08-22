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
  operation_status_id?: number;
  operation_status?: string;
  operation_status_display?: string;
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
    // Try to parse JSON; if it fails, fallback to text
    let message = 'Failed to save property';
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const error = await response.json();
        message = error.error || message;
      } catch (_) {}
    } else {
      try { message = await response.text(); } catch (_) {}
    }
    throw new Error(message);
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
    let message = 'Failed to unsave property';
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const error = await response.json();
        message = error.error || message;
      } catch (_) {}
    } else {
      try { message = await response.text(); } catch (_) {}
    }
    throw new Error(message);
  }
};

/**
 * Check if specific properties are saved by the current user
 */
export const checkSavedStatus = async (propertyIds: number[]): Promise<SavedPropertiesResponse> => {
  const response = await fetch(`/api/properties/saved-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ propertyIds }),
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
