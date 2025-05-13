import React from 'react';
import styles from '../styles/PropertyCard.module.css';

type PropertyCardProps = {
  imageUrl: string;
  description: string;
  price: string;
  rooms: number;
  bathrooms: number;
  address: string;
  squareMeters: number;
  yearBuilt: number;
};

const PropertyCard: React.FC<PropertyCardProps> = ({ imageUrl, description, price, rooms, bathrooms, address, squareMeters, yearBuilt }) => {
  return (
    <div className={styles.card}>
      <img src={imageUrl} alt="Property" className={styles.image} />
      <div className={styles.details}>
        <h3 className={styles.price}>💰 {price}</h3>
        <p className={styles.address}>📍 {address}</p>
        <div className={styles.info}>
          <p>🛏️ {rooms}</p>
          <p>🛁 {bathrooms}</p>
          <p>📐 {squareMeters} m²</p>
          <p>🏗️ {yearBuilt}</p>
        </div>
        <p className={styles.description}>{description}</p>
        <button className={styles.saveButton}>Save</button>
      </div>
    </div>
  );
};

export default PropertyCard;