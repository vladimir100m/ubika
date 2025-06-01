import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import PropertyCard from '../components/PropertyCard';
import styles from '../styles/Home.module.css';

interface Property {
  id: number;
  title: string;
  location: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  area: string;
  imageUrl: string;
  description: string;
  lat: number;
  lng: number;
  amenities: string[];
  propertyType: string;
  listingType: string;
}

const SavedProperties: React.FC = () => {
  const { user, error, isLoading } = useUser();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const router = useRouter();

  // Load all properties
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const response = await fetch('/api/properties');
        const data = await response.json();
        setProperties(data);
      } catch (error) {
        console.error('Error loading properties:', error);
      }
    };
    loadProperties();
  }, []);

  // Handle authentication and load favorites
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/login');
      return;
    }
    
    if (user) {
      const userFavorites = JSON.parse(localStorage.getItem(`favorites_${user.sub}`) || '[]');
      setFavorites(userFavorites);
    }
  }, [user, isLoading, router]);

  // Filter saved properties when favorites or properties change
  useEffect(() => {
    if (properties.length > 0 && favorites.length > 0) {
      const saved = properties.filter(property => favorites.includes(property.id));
      setSavedProperties(saved);
    } else {
      setSavedProperties([]);
    }
  }, [properties, favorites]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '32px' }}>
            My Saved Properties
          </h1>
          
          {savedProperties.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#666' }}>
                No Saved Properties Yet
              </h2>
              <p style={{ fontSize: '16px', color: '#888', marginBottom: '24px' }}>
                Start saving properties you're interested in by clicking the heart icon on any property card.
              </p>
              <button 
                onClick={() => router.push('/')}
                style={{ 
                  backgroundColor: '#1277e1', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  padding: '12px 24px', 
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Browse Properties
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
                You have {savedProperties.length} saved {savedProperties.length === 1 ? 'property' : 'properties'}
              </p>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '24px' 
              }}>
                {savedProperties.map((property) => (
                  <PropertyCard 
                    key={property.id}
                    image_url={property.imageUrl}
                    description={property.description}
                    price={property.price}
                    rooms={property.bedrooms}
                    bathrooms={property.bathrooms}
                    address={property.location}
                    squareMeters={parseInt(property.area)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SavedProperties;