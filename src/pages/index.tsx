import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Banner from '../components/Banner';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import styles from '../styles/Home.module.css';
import { Property } from '../types'; // Import Property type
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

const Home: React.FC = () => {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]); // Typed state

  useEffect(() => {
    const fetchProperties = async () => {
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
          setProperties([]); // Set to empty array on error or unexpected format
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]); // Set to empty array on catch
      }
    };

    fetchProperties();
  }, []);

  // Function to handle property card click
  const handlePropertyClick = (propertyId: number) => {
    router.push({
      pathname: '/map',
      query: { selectedPropertyId: propertyId }
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
        <Carousel responsive={responsive}>
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              image_url={property.image_url} // Corrected from imageUrl
              description={property.description}
              price={`$${property.price}`}
              address={property.address}
              rooms={property.rooms}
              bathrooms={property.bathrooms}
              squareMeters={property.squareMeters}
              yearBuilt={property.yearBuilt} // Keep as is, PropertyCard will handle undefined
              latitude={property.latitude ?? property.geocode?.lat}
              longitude={property.longitude ?? property.geocode?.lng}
              onClick={() => handlePropertyClick(property.id)} // Added onClick handler
            />
          ))}
        </Carousel>
      </section>

      <footer className={styles.footer}>
        <p>&copy; 2025 Ubika. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;