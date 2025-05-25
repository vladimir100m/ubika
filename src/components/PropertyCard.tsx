import React, { useState, useEffect } from 'react';
import styles from '../styles/PropertyCard.module.css';
import { Property } from '../types';

export type PropertyCardProps = Pick<
  Property,
  | 'image_url' // Corrected from imageUrl
  | 'description'
  | 'price'
  | 'rooms'
  | 'bathrooms'
  | 'address'
  | 'squareMeters'
> & {
  // yearBuilt, latitude, and longitude are optional in Property, so they should be optional here too
  yearBuilt?: number;
  latitude?: number;
  longitude?: number;
  onClick?: () => void; // Add onClick prop
};

const PropertyDialog: React.FC<{ property: PropertyCardProps; onClose: () => void }> = ({ property, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <img src={property.image_url} alt="Property" className={styles.dialogImage} />
        <div className={styles.dialogDetails}>
          <h3>{property.price}</h3>
          <p>{property.address}</p>
          <p>{property.description}</p>
          <p>Rooms: {property.rooms}</p>
          <p>Bathrooms: {property.bathrooms}</p>
          <p>Size: {property.squareMeters} m²</p>
          {/* Conditionally render yearBuilt if it exists */}
          {property.yearBuilt && <p>Year Built: {property.yearBuilt}</p>}
        </div>
        {(property.latitude && property.longitude) && (
          <div className={styles.mapContainer}>
            <iframe
              src={`https://www.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              title="Property Location"
            ></iframe>
          </div>
        )}
        <button onClick={onClose} className={styles.closeButton}>Close</button>
      </div>
    </div>
  );
};

const PropertyCard: React.FC<PropertyCardProps> = (props) => {
  const [isDialogOpen, setDialogOpen] = useState(false);

  const handleCardClick = () => {
    // If an external onClick handler is provided, use it
    if (props.onClick) {
      props.onClick();
    } else {
      // Otherwise, use the default dialog behavior
      setDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <div className={styles.card} onClick={handleCardClick}>
        <img src={props.image_url} alt="Property" className={styles.image} />
        <div className={styles.details}>
          <h3 className={styles.price}>💰 {props.price}</h3>
          <p className={styles.address}>📍 {props.address}</p>
          <div className={styles.info}>
            <p>🛏️ {props.rooms}</p>
            <p>🛁 {props.bathrooms}</p>
            <p>📐 {props.squareMeters} m²</p>
            {/* Conditionally render yearBuilt if it exists */}
            {props.yearBuilt && <p>🏗️ {props.yearBuilt}</p>}
          </div>
          <p className={styles.description}>{props.description}</p>
        </div>
      </div>
      {isDialogOpen && <PropertyDialog property={props} onClose={handleCloseDialog} />}
    </>
  );
};

export default PropertyCard;