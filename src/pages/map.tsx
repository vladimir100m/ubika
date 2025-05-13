import React from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';

const MapPage: React.FC = () => {
  const router = useRouter();
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (router.query.address) {
      setAddress(router.query.address as string);
    }
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
      <div style={{ display: 'flex', flexDirection: 'row-reverse', height: '100%' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {/* Placeholder for property details or listings */}
          <h2>Property Listings</h2>
          <p>Details about properties will go here.</p>
        </div>
        <div style={{ flex: 2, height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }} className={styles.mapContainer}>
          <iframe
            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(address || 'San Francisco, CA')}`}
            width="100%"
            height="100%"
            style={{ border: '2px solid #ccc', aspectRatio: '1 / 1' }}
            allowFullScreen={true}
            loading="lazy"
          ></iframe>
        </div>
      </div>
      <footer className={styles.footer}>
        <p>&copy; 2025 Ubika. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MapPage;