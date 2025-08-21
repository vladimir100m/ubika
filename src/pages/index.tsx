import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Banner from '../components/Banner';
import PropertyCard from '../components/PropertyCard';
import styles from '../styles/Home.module.css';
import { Property } from '../types'; // Import Property type
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import Header from 'components/Header';
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

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
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
        console.error('Error loading saved properties status:', error);
        
        // Check if it's an auth error
        if (error instanceof Error && error.message.includes('Unauthorized')) {
          // Just set empty set - no need to redirect as this is a background load
          console.log('User not authenticated for saved properties check');
        }
        
        setSavedPropertyIds(new Set());
      }
    };

    
    // Only load saved status after user loading is complete and we have properties
    if (!isLoading && properties.length > 0) {
      loadSavedStatus();
    }
  }, [isLoading, properties ]);

  // Function to handle property card click
  const handlePropertyClick = (propertyId: number) => {
    router.push({
      pathname: '/map',
      query: { selectedPropertyId: propertyId }
    });
  };

  // Function to toggle favorite status using database API
  const handleFavoriteToggle = async (propertyId: number, newStatus?: boolean) => {
    setSavedPropertyIds(prevSavedIds => {
      const isCurrentlySaved = newStatus !== undefined ? !newStatus : savedPropertyIds.has(propertyId);
      const newSavedIds = new Set(prevSavedIds);
      if (isCurrentlySaved) {
        newSavedIds.delete(propertyId);
      } else {
        newSavedIds.add(propertyId);
      }
      return newSavedIds;
    });
  };

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 1024 },
      items: 5
    },
    desktop: {
      breakpoint: { max: 1024, min: 768 },
      items: 3
    },
    tablet: {
      breakpoint: { max: 768, min: 464 },
      items: 2
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1
    }
  };

  return (
    <div className={styles.container} style={{ paddingTop: '80px' }}>
  <Header selectedOperation="buy" onOperationChange={() => {}} />
      <Banner />

      <section className={styles.featuredProperties}>
        <h2>Propiedades que estabas buscando</h2>
        
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
          <Carousel responsive={responsive}>
            {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  image_url={property.image_url}
                  description={property.description}
                  price={`$${property.price}`}
                  address={property.address}
                  rooms={property.rooms}
                  bathrooms={property.bathrooms}
                  squareMeters={property.squareMeters}
                  yearBuilt={property.yearBuilt}
                  latitude={property.latitude ?? property.geocode?.lat}
                  longitude={property.longitude ?? property.geocode?.lng}
                  operation_status_id={property.operation_status_id}
                  operation_status={property.operation_status}
                  operation_status_display={property.operation_status_display}
                  onClick={() => handlePropertyClick(property.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorite={savedPropertyIds.has(property.id)}
                />
              ))}
          </Carousel>
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
