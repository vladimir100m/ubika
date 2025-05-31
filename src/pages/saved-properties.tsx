import React from 'react';
import Header from 'components/Header';
import styles from '../styles/Home.module.css';

const SavedProperties: React.FC = () => {
  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.contentSection}>
        <h1>Saved Properties</h1>
        <p>This page will display your saved properties. No login required.</p>
        <p>Save properties by using the star icon on property cards.</p>
      </div>
    </div>
  );
};

export default SavedProperties;