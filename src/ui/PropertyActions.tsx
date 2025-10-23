'use client';

import React, { useState, useEffect } from 'react';
import styles from '../styles/PropertyDetailCard.module.css';

interface PropertyActionsProps {
  propertyId: number;
}

const PropertyActions: React.FC<PropertyActionsProps> = ({ propertyId }) => {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`saved_property_${propertyId}`);
    setIsSaved(saved === 'true');
  }, [propertyId]);

  const handleSaveToggle = () => {
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    localStorage.setItem(`saved_property_${propertyId}`, String(newSavedState));
  };

  return (
    <div className={styles.actions}>
      <button onClick={handleSaveToggle} className={styles.saveButton}>
        <i className={isSaved ? 'fas fa-heart' : 'far fa-heart'}></i>
        {isSaved ? 'Saved' : 'Save'}
      </button>
      <a href={`mailto:agent@ubika.com?subject=Inquiry about Property #${propertyId}`} className={styles.contactButton}>
        Contact Agent
      </a>
    </div>
  );
};

export default PropertyActions;
