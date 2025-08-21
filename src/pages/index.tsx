import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Banner from '../components/Banner';
import PropertyCard from '../components/PropertyCard';
import styles from '../styles/Home.module.css';
import { Property } from '../types'; // Import Property type
import Header from '../components/Header';
import { checkSavedStatus, toggleSaveProperty } from '../utils/savedPropertiesApi';

const Home: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const [properties, setProperties] = useState<Property[]>([]); // Typed state
  const [savedPropertyIds, setSavedPropertyIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get operation from query parameters, default to 'buy'
  const selectedOperation = typeof router.query.operation === 'string' && (router.query.operation === 'buy' || router.query.operation === 'rent')
    ? router.query.operation as 'buy' | 'rent'
    : 'buy';

  const handleOperationChange = (operation: 'buy' | 'rent') => {
    // Navigate to map page with operation filter instead of filtering home page
    router.push({
      pathname: '/map',
      query: { operation }
    });
  };

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all properties without operation filter for home page
        const response = await fetch('/api/properties');
        if (!response.ok) {
          throw new Error(`Error fetching properties: ${response.statusText}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setProperties(data);
        } else {
          console.error('Error fetching properties: Data is not an array', data);
          setError('Unable to load properties. Please try again later.');
          setProperties([]); // Set to empty array on error or unexpected format
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('Unable to load properties. Please try again later.');
        setProperties([]); // Set to empty array on catch
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [user, isLoading]);

  // TODO: a veces se llama dos veces, unificar con un use effect general
  useEffect(() => {
    // Load saved properties status if user is authenticated
    const loadSavedStatus = async () => {
      // Skip if no user or in development without proper database
      if (!user) {
        setSavedPropertyIds(new Set());
        return;
      }

      try {
        const savedStatus = await checkSavedStatus(properties.map(p => p.id));
        // `checkSavedStatus` returns an object map { [propertyId]: boolean }
        const savedIds = new Set<number>();
        if (savedStatus && typeof savedStatus === 'object') {
          Object.entries(savedStatus).forEach(([id, val]) => {
            if (val) savedIds.add(Number(id));
          });
        }
        setSavedPropertyIds(savedIds);
      } catch (error) {
        // Silently handle errors in development to avoid console spam
        if (process.env.NODE_ENV === 'development') {
          console.warn('Saved properties API not available in development');
        } else {
          console.error('Error loading saved properties status:', error);
        }
        
        setSavedPropertyIds(new Set());
      }
    };

    
    // Only load saved status after user loading is complete and we have properties
    if (!isLoading && properties.length > 0) {
      loadSavedStatus();
    }
  }, [isLoading, properties, user ]);

  // Function to handle property card click
  const handlePropertyClick = (propertyId: number) => {
    router.push({
      pathname: '/map',
      query: { selectedPropertyId: propertyId }
    });
  };

  // Function to toggle favorite status using database API
  const handleFavoriteToggle = async (propertyId: number, newStatus?: boolean) => {
    if (!user) {
      // Redirect to login if user is not authenticated
      router.push('/auth/signin');
      return;
    }

    try {
      const isCurrentlySaved = newStatus !== undefined ? !newStatus : savedPropertyIds.has(propertyId);
      await toggleSaveProperty(propertyId, !isCurrentlySaved);
      
      // Update local state
      setSavedPropertyIds(prevSavedIds => {
        const newSavedIds = new Set(prevSavedIds);
        if (isCurrentlySaved) {
          newSavedIds.delete(propertyId);
        } else {
          newSavedIds.add(propertyId);
        }
        return newSavedIds;
      });
    } catch (error) {
      console.error('Error toggling favorite status:', error);
    }
  };

  return (
    <div className={styles.container} style={{ paddingTop: '80px' }}>
      <Header selectedOperation={selectedOperation} onOperationChange={handleOperationChange} />
      
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <Banner />
      </div>

      {/* Featured Properties Section */}
      <section className={styles.featuredSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Featured Properties</h2>
          <p className={styles.sectionSubtitle}>Discover the best properties in Argentina</p>
        </div>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading properties...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={() => router.reload()}
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Featured properties carousel/grid - first 6 properties */}
            {properties.length > 0 && (
              <div className={styles.featuredPropertiesGrid}>
                {properties.slice(0, 6).map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isFavorite={savedPropertyIds.has(property.id)}
                    onFavoriteToggle={() => handleFavoriteToggle(property.id)}
                  />
                ))}
              </div>
            )}
            
            {/* All Properties Section */}
            <div className={styles.allPropertiesSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>All Properties ({properties.length})</h2>
                <button 
                  className={styles.viewMapButton}
                  onClick={() => router.push('/map')}
                >
                  View on Map
                </button>
              </div>
              
              <div className={styles.propertiesScrollContainer}>
                <div className={styles.propertiesGrid}>
                  {properties.length > 0 ? (
                    properties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        isFavorite={savedPropertyIds.has(property.id)}
                        onFavoriteToggle={() => handleFavoriteToggle(property.id)}
                      />
                    ))
                  ) : (
                    <div className={styles.emptyState}>
                      <h3>No properties found</h3>
                      <p>We couldn't find any properties matching your criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} Ubika - Leading real estate marketplace | Email: info@ubika.com</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
