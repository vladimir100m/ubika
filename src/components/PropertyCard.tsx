import React, { useState } from 'react';
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
  latitude: number;
  longitude: number;
};

const PropertyDialog: React.FC<{ property: PropertyCardProps; onClose: () => void }> = ({ property, onClose }) => {
  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <img src={property.imageUrl} alt="Property" className={styles.dialogImage} />
        <div className={styles.dialogDetails}>
          <h3>{property.price}</h3>
          <p>{property.address}</p>
          <p>{property.description}</p>
          <p>Rooms: {property.rooms}</p>
          <p>Bathrooms: {property.bathrooms}</p>
          <p>Size: {property.squareMeters} m²</p>
          <p>Year Built: {property.yearBuilt}</p>
        </div>
        <div className={styles.mapContainer}>
          <iframe
            src={`https://www.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            title="Property Location"
          ></iframe>
        </div>
        <button onClick={onClose} className={styles.closeButton}>Close</button>
      </div>
    </div>
  );
};

const PropertyCard: React.FC<PropertyCardProps> = (props) => {
  const [isDialogOpen, setDialogOpen] = useState(false);

  const handleCardClick = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <div className={styles.card} onClick={handleCardClick}>
        <img src={props.imageUrl} alt="Property" className={styles.image} />
        <div className={styles.details}>
          <h3 className={styles.price}>💰 {props.price}</h3>
          <p className={styles.address}>📍 {props.address}</p>
          <div className={styles.info}>
            <p>🛏️ {props.rooms}</p>
            <p>🛁 {props.bathrooms}</p>
            <p>📐 {props.squareMeters} m²</p>
            <p>🏗️ {props.yearBuilt}</p>
          </div>
          <p className={styles.description}>{props.description}</p>
        </div>
      </div>
      {isDialogOpen && <PropertyDialog property={props} onClose={handleCloseDialog} />}
    </>
  );
};

export default PropertyCard;