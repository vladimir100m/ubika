import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Banner from '../components/Banner';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import MobilePropertyCard from '../components/MobilePropertyCard';
import MobileNavigation from '../components/MobileNavigation';
import styles from '../styles/Home.module.css';
import mobileStyles from '../styles/Mobile.module.css';
import { Property } from '../types'; // Import Property type
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import useMediaQuery from '../utils/useMediaQuery';

const Home: React.FC = () => {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]); // Typed state
  const [favorites, setFavorites] = useState<number[]>([]);
  const isMobile = useMediaQuery('(max-width: 768px)');

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

    // Load favorites from localStorage
    const loadFavorites = () => {
      try {
        const savedFavorites = localStorage.getItem('favorites');
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };

    fetchProperties();
    loadFavorites();
  }, []);

  // Function to handle property card click
  const handlePropertyClick = (propertyId: number) => {
    router.push({
      pathname: '/map',
      query: { selectedPropertyId: propertyId }
    });
  };

  // Function to toggle favorite status
  const handleFavoriteToggle = (propertyId: number) => {
    setFavorites(prevFavorites => {
      const newFavorites = prevFavorites.includes(propertyId)
        ? prevFavorites.filter(id => id !== propertyId)
        : [...prevFavorites, propertyId];
      
      // Save to localStorage
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      return newFavorites;
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
      <header className={`${styles.navbar} ${isMobile ? mobileStyles.onlyMobile : ''}`}>
        <div className={styles.logo}>Ubika</div>
        <div className={mobileStyles.onlyDesktop}>
          <nav>
            <a href="#">Buy</a>
            <a href="#">Rent</a>
            <a href="#">Sell</a>
            <a href="#">Mortgage</a>
            <a href="#">Saved Homes</a>
          </nav>
        </div>
      </header>
      <Banner />

      <section className={styles.featuredProperties}>
        <h2>Propiedades que estabas buscando</h2>
        {isMobile ? (
          <div className={mobileStyles.mobileGrid}>
            {properties.map((property) => (
              <MobilePropertyCard
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
                onClick={() => handlePropertyClick(property.id)}
                onFavoriteToggle={handleFavoriteToggle}
                isFavorite={favorites.includes(property.id)}
              />
            ))}
          </div>
        ) : (
          <Carousel responsive={responsive}>
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
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
                onClick={() => handlePropertyClick(property.id)}
              />
            ))}
          </Carousel>
        )}
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3>About Us</h3>
            <p>Ubika is a leading real estate marketplace dedicated to empowering consumers with data.</p>
          </div>
          <div className={styles.footerSection}>
            <h3>Contact</h3>
            <p>Email: info@ubika.com</p>
            <p>Phone: (123) 456-7890</p>
          </div>
          <div className={styles.footerSection}>
            <h3>Follow Us</h3>
            <div className={styles.socialIcons}>
              <a href="#" aria-label="Facebook">FB</a>
              <a href="#" aria-label="Twitter">TW</a>
              <a href="#" aria-label="Instagram">IG</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} Ubika. All rights reserved.</p>
        </div>
      </footer>

      {/* Mobile Navigation */}
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default Home;