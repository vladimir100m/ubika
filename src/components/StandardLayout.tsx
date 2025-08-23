import React from 'react';
import Header from './Header';
import Footer from './Footer';
import styles from '../styles/StandardLayout.module.css';
import { FilterOptions } from './MapFilters';

interface StandardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  fullWidth?: boolean;
  backgroundColor?: string;
  className?: string;
  showMapFilters?: boolean;
  onFilterChange?: (filters: FilterOptions) => void;
  onSearchLocationChange?: (location: string) => void;
  searchLocation?: string;
  initialFilters?: Partial<FilterOptions>;
}

const StandardLayout: React.FC<StandardLayoutProps> = ({
  children,
  title,
  subtitle,
  showHeader = true,
  showFooter = true,
  fullWidth = false,
  backgroundColor = '#ffffff',
  className = '',
  showMapFilters = false,
  onFilterChange,
  onSearchLocationChange,
  searchLocation,
  initialFilters,
}) => {
  return (
        <div className={`${styles.standardLayout} ${className}`} style={{ backgroundColor }}>
      {showHeader && (
        <Header 
          showMapFilters={showMapFilters}
          onFilterChange={onFilterChange}
          onSearchLocationChange={onSearchLocationChange}
          searchLocation={searchLocation}
          initialFilters={initialFilters}
        />
      )}
      
      <main className={styles.mainContent}>
        {(title || subtitle) && (
          <div className={styles.pageHeader}>
            <div className={fullWidth ? styles.fullWidthContainer : styles.container}>
              {title && <h1 className={styles.pageTitle}>{title}</h1>}
              {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
            </div>
          </div>
        )}
        
        <div className={fullWidth ? styles.fullWidthContainer : styles.container}>
          <div className={styles.pageContent}>
            {children}
          </div>
        </div>
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
};

export default StandardLayout;
