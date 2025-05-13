import React from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';
import { PropertyCard } from '../components';
import axios from 'axios';

const MapPage: React.FC = () => {
  const router = useRouter();
  const [address, setAddress] = useState<string | null>(null);
  const [propertyLocations, setPropertyLocations] = useState([]);

  useEffect(() => {
    if (router.query.address) {
      setAddress(router.query.address as string);
    }

    // Fetch properties from the database
    const fetchProperties = async () => {
      try {
        const response = await axios.get('/api/properties');
        setPropertyLocations(response.data);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };

    fetchProperties();
  }, [router.query]);

  return (
    <div className={styles.container}>
      <header className={styles.navbar}>
        <div className={styles.logo} onClick={() => router.push('/')}>Ubika</div>
        <nav>
          <a href="#">Buy</a>
          <a href="#">Rent</a>
          <a href="#">Sell</a>
          <a href="#">Mortgage</a>
          <a href="#">Saved Homes</a>
        </nav>
      </header>
      <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
        <div style={{ flex: 1.5, height: '90vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }} className={styles.mapContainer}>
          <iframe
            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(address || 'San Francisco, CA')}`}
            width="100%"
            height="100%"
            style={{ border: '2px solid #ccc', aspectRatio: '1 / 1' }}
            allowFullScreen={true}
            loading="lazy"
          ></iframe>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: '#f9f9f9' }}>
          <h2>Property Listings</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }} className={styles.propertyGrid}>
            {propertyLocations.map((property) => (
              <PropertyCard
                key={property.id}
                imageUrl={property.imageurl}
                description={property.description}
                price={`$${property.price}`}
                address={property.address}
                rooms={property.rooms}
                bathrooms={property.bathrooms}
                squareMeters={property.squaremeters}
                yearBuilt={property.yearbuilt}
              />
            ))}
          </div>
        </div>
      </div>
      <footer className={styles.footer}>
        <p>&copy; 2025 Ubika. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MapPage;