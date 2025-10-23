/**
 * Centralized Property Formatting Utilities
 * Single source of truth for consistent property data formatting
 */

/**
 * Format price as USD currency (no decimals for cleaner real estate display)
 */
export function formatPropertyPrice(price: number | undefined | null): string {
  if (price === null || price === undefined || isNaN(price)) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Format price as compact (e.g., "1.2M", "450K")
 * Useful for card views where space is limited
 */
export function formatPropertyPriceCompact(price: number | undefined | null): string {
  if (price === null || price === undefined || isNaN(price)) {
    return 'N/A';
  }

  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(1)}M`;
  }
  if (price >= 1_000) {
    return `$${(price / 1_000).toFixed(0)}K`;
  }
  return `$${price}`;
}

/**
 * Format date from ISO string or Date object
 * Default format: "January 15, 2024"
 */
export function formatPropertyDate(date: string | Date | undefined | null, format: 'long' | 'short' = 'long'): string {
  if (!date) {
    return 'N/A';
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (format === 'short') {
      return dateObj.toLocaleDateString('en-US', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
      });
    }

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Format area/size (sq meters or sq feet)
 */
export function formatPropertySize(size: number | undefined | null, unit: 'sqm' | 'sqft' = 'sqm'): string {
  if (size === null || size === undefined || isNaN(size)) {
    return 'N/A';
  }

  const unitLabel = unit === 'sqm' ? 'sqm' : 'sqft';
  return `${size.toLocaleString('en-US')} ${unitLabel}`;
}

/**
 * Format property type display name (with fallback)
 */
export function formatPropertyType(typeName: string | undefined | null): string {
  if (!typeName) {
    return 'Property';
  }

  // Capitalize first letter of each word
  return typeName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format property status display name (with color styling hint)
 */
export function formatPropertyStatus(statusName: string | undefined | null): string {
  if (!statusName) {
    return 'Unknown';
  }

  return statusName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format address (combine address, city, state, zip)
 */
export function formatPropertyAddress(address: {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
}): string {
  const parts: string[] = [];

  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.zip) parts.push(address.zip);

  return parts.join(', ') || 'N/A';
}

/**
 * Format full address display for property cards/detail
 */
export function formatPropertyFullAddress(street: string | null | undefined, city: string | null | undefined, state?: string | null, country?: string | null): string {
  const parts: string[] = [];

  if (street) parts.push(street);
  if (city) parts.push(city);
  if (state) parts.push(state);

  return parts.join(', ') || 'Location TBD';
}

/**
 * Format bedrooms/bathrooms for display (with icons as fallback)
 */
export function formatPropertyBedsBaths(beds: number | undefined | null, baths: number | undefined | null): string {
  const bedStr = beds !== null && beds !== undefined ? `${beds} bed${beds !== 1 ? 's' : ''}` : '';
  const bathStr = baths !== null && baths !== undefined ? `${baths} bath${baths !== 1 ? 's' : ''}` : '';

  return [bedStr, bathStr].filter(Boolean).join(' • ') || 'Details TBD';
}
