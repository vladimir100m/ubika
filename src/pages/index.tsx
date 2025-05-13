import React from 'react';
import { useRouter } from 'next/router';
import Banner from '../components/Banner';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import styles from '../styles/Home.module.css';

const Home: React.FC = () => {
  const router = useRouter();

  // const handleSearch = (address: string) => {
  //   router.push('/map');
  // };

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
          <PropertyCard
            imageUrl="/properties/apartamento-ciudad.jpg"
            description="Casa moderna con diseño minimalista y amplios espacios."
            price="$250,000"
            address="123 Main St, Ciudad Central"
            rooms={3}
            bathrooms={2}
            squareMeters={120}
            yearBuilt={2015}
          />
          <PropertyCard
            imageUrl="/properties/cabana-bosque.jpg"
            description="Cabaña acogedora en el bosque, ideal para desconectar."
            price="$150,000"
            address="456 Forest Lane, Bosque Verde"
            rooms={2}
            bathrooms={1}
            squareMeters={80}
            yearBuilt={2010}
          />
          <PropertyCard
            imageUrl="/properties/penthouse-lujo.jpg"
            description="Penthouse de lujo con vistas espectaculares de la ciudad."
            price="$1,200,000"
            address="789 Skyline Blvd, Ciudad Central"
            rooms={4}
            bathrooms={3}
            squareMeters={250}
            yearBuilt={2020}
          />
          <PropertyCard
            imageUrl="/properties/casa-playa.jpg"
            description="Casa frente al mar con acceso privado a la playa."
            price="$850,000"
            address="321 Ocean Drive, Playa Azul"
            rooms={5}
            bathrooms={4}
            squareMeters={300}
            yearBuilt={2018}
          />
          <PropertyCard
            imageUrl="/properties/casa-campo.jpg"
            description="Casa rústica en el campo con amplios jardines."
            price="$400,000"
            address="654 Country Road, Valle Verde"
            rooms={4}
            bathrooms={3}
            squareMeters={200}
            yearBuilt={2012}
          />
        </div>
      </section>

      <footer className={styles.footer}>
        <p>&copy; 2025 Ubika. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;