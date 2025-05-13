import React from 'react';
import styles from '../styles/Home.module.css';

const FeaturedProperties: React.FC = () => {
  return (
    <div className={styles.featuredProperties}>
      <h2>Featured Properties</h2>
      <div className={styles.propertyList}>
        <div className={styles.propertyItem}>
          <img src="/casa-playa.jpg" alt="Casa Playa" />
          <h3>Casa Playa</h3>
          <p>Beautiful beach house with stunning views.</p>
        </div>
        <div className={styles.propertyItem}>
          <img src="/departamento-familiar.jpg" alt="Departamento Familiar" />
          <h3>Departamento Familiar</h3>
          <p>Spacious family apartment in the city center.</p>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProperties;