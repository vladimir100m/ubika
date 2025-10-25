import PropertyCard from './PropertyCard';
import { Property } from '../types';
import styles from '../styles/Home.module.css';

interface FeaturedPropertiesProps {
  limit?: number;
  title?: string;
  operation?: 'buy' | 'rent';
}

async function getFeaturedProperties(limit: number, operation?: 'buy' | 'rent') {
  const queryParams = new URLSearchParams();
  queryParams.append('limit', limit.toString());
  if (operation) {
    queryParams.append('operation', operation);
  }

  // This fetch needs to be an absolute URL when called from a Server Component
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/properties?${queryParams.toString()}`, {
    cache: 'no-store', // Re-fetch data on every request for dynamic content
  });

  if (!response.ok) {
    throw new Error(`Error fetching properties: ${response.statusText}`);
  }
  const data = await response.json();
  if (Array.isArray(data)) {
    return data;
  }
  return [];
}

const FeaturedProperties: React.FC<FeaturedPropertiesProps> = async ({ 
  limit = 6, 
  title = "Featured Properties",
  operation 
}) => {
  // Server-side data fetching
  let properties: Property[] = [];
  let error: string | null = null;

  try {
    properties = await getFeaturedProperties(limit, operation);
  } catch (e: any) {
    console.error('Error fetching properties:', e);
    error = 'Unable to load properties. Please try again later.';
  }

  if (error) {
    return (
      <div className={styles.propertySection}>
        <div className={styles.propertyHeader}>
          <h2 className={styles.propertyTitle}>{title}</h2>
        </div>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.propertySection}>
      <div className={styles.propertyHeader}>
        <h2 className={styles.propertyTitle}>{title}</h2>
      </div>
      {properties.length > 0 ? (
        <div className={styles.propertyGrid}>
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h3>No properties found</h3>
          <p>We couldn't find any featured properties at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default FeaturedProperties;