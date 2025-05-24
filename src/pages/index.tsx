import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Banner from '../components/Banner';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import styles from '../styles/Home.module.css';

const Home: React.FC = () => {
  const router = useRouter();
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/properties');
        const data = await response.json();
        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };

    fetchProperties();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.navbar}>
        <div className={styles.logo}>Ubika</div>
        <nav>
          <a href="#">Buy</a>
          <a href="#">Rent</a>
          <a href="#">Sell</a>
          <a href="#">Mortgage</a>
          <a href="#">Saved Homes</a>
        </nav>
      </header>
      <Banner />

      <section className={styles.featuredProperties}>
        <h2>Propiedades que estabas buscando</h2>
        <div className={styles.propertyGrid}>
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              imageUrl={property.image_url}
              description={property.description}
              price={`$${property.price}`}
              address={property.address}
              rooms={property.rooms}
              bathrooms={property.bathrooms}
              squareMeters={property.squareMeters}
              yearBuilt={property.yearBuilt}
            />
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <p>&copy; 2025 Ubika. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;