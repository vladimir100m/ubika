import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signIn, signOut } from 'next-auth/react';
import styles from '../styles/Header.module.css';
import useMediaQuery from '../utils/useMediaQuery';
import MapFilters, { FilterOptions } from './MapFilters';

interface HeaderProps {
  showMapFilters?: boolean;
  onFilterChange?: (filters: FilterOptions) => void;
  onSearchLocationChange?: (location: string) => void;
  searchLocation?: string;
  initialFilters?: Partial<FilterOptions>;
}

const Header: React.FC<HeaderProps> = ({ 
  showMapFilters = false, 
  onFilterChange, 
  onSearchLocationChange,
  searchLocation,
  initialFilters 
}) => {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 991px)');
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const [isFiltersPopupOpen, setIsFiltersPopupOpen] = useState(false);
  const [isAccountPopupOpen, setIsAccountPopupOpen] = useState(false);

  // Determine if there are any initial filters to show a small badge
  const hasActiveFilters = Boolean(
    initialFilters && (
      initialFilters.operation ||
      initialFilters.priceMin ||
      initialFilters.priceMax ||
      initialFilters.beds ||
      initialFilters.baths ||
      initialFilters.homeType ||
      initialFilters.moreFilters?.minArea ||
      initialFilters.moreFilters?.maxArea ||
      (initialFilters.moreFilters?.keywords && initialFilters.moreFilters.keywords.length > 0)
    )
  );

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogoClick = () => {
    router.push('/');
  };

  const handleAuthAction = () => {
    if (user) {
      setIsAccountPopupOpen(!isAccountPopupOpen);
    } else {
      signIn('google');
    }
  };

  const toggleAccountDropdown = () => {
    setIsAccountPopupOpen(!isAccountPopupOpen);
  };

  const closeAccountDropdown = () => {
    setIsAccountPopupOpen(false);
  };

  const handleAccountMenuClick = (path: string) => {
    setIsAccountPopupOpen(false);
    router.push(path);
  };

  const handleSignOut = () => {
    setIsAccountPopupOpen(false);
    signOut();
  };

  const toggleFiltersPopup = () => {
    setIsFiltersPopupOpen(!isFiltersPopupOpen);
  };

  const closeFiltersPopup = () => {
    setIsFiltersPopupOpen(false);
  };

  const closeAccountPopup = () => {
    setIsAccountPopupOpen(false);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isFiltersPopupOpen && !target.closest(`.${styles.filtersPopup}`) && !target.closest(`.${styles.filtersButton}`)) {
        closeFiltersPopup();
      }
      if (isAccountPopupOpen && 
          !target.closest(`.${styles.accountPopup}`) && 
          !target.closest(`.${styles.accountButton}`) &&
          !target.closest(`.${styles.mobilePill}`)) {
        closeAccountPopup();
      }
    };

    if (isFiltersPopupOpen || isAccountPopupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFiltersPopupOpen, isAccountPopupOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        {/* Logo Section */}
        <div 
          className={styles.logoSection} 
          onClick={handleLogoClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleLogoClick()}
          aria-label="Ubika Home"
        >
          <img 
            src="/ubika-logo.png" 
            alt="Ubika Logo" 
            width={isMobile ? 32 : isTablet ? 36 : 40} 
            height={isMobile ? 32 : isTablet ? 36 : 40}
            loading="eager"
            className={styles.logoImage}
          />
          {!isMobile && (
            <span className={styles.logoText}>Ubika</span>
          )}
        </div>
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className={styles.desktopNavigation} role="navigation" aria-label="Main navigation">
            {/* Navigation Links - currently empty (Sell moved into Me menu) */}
            <div className={styles.navLinks}></div>
            
            {/* Right Section - Filters and Auth */}
            <div className={styles.rightSection}>
              {onFilterChange && (
                <button 
                  className={`${styles.filtersButton} ${isFiltersPopupOpen ? styles.active : ''}`}
                  onClick={toggleFiltersPopup}
                  aria-label="Open filters"
                  aria-expanded={isFiltersPopupOpen}
                >
                  <span className={styles.navButtonIcon} role="img" aria-hidden="true">🔍</span>
                  Filters
                  {hasActiveFilters && <span className={styles.filtersBadge} aria-hidden="true">•</span>}
                </button>
              )}
              
              {!isLoading && (
                <button 
                  onClick={handleAuthAction}
                  className={`${styles.navButton} ${styles.accountButton}`}
                  aria-label={user ? 'Me menu' : 'Sign in with Google'}
                >
                  <span className={styles.navButtonIcon} role="img" aria-hidden="true">
                    {user ? '👤' : '🔑'}
                  </span>
                  {user ? 'Me' : 'Login'}
                </button>
              )}
            </div>
          </nav>
        )}

        {/* Mobile Navigation */}
        {isMobile && (
          <div className={styles.mobileNavContainer}>
            <div className={styles.mobileNavScroll} role="navigation" aria-label="Mobile navigation">
              {/* Order: Filters, Account/Login (Sell moved into Me menu) */}
              {onFilterChange && (
                <button
                  className={`${styles.mobilePill} ${isFiltersPopupOpen ? styles.active : ''}`}
                  onClick={toggleFiltersPopup}
                  aria-label="Open filters"
                  aria-expanded={isFiltersPopupOpen}
                >
                  🔍 Filters
                  {hasActiveFilters && <span className={styles.filtersBadge} aria-hidden="true">•</span>}
                </button>
              )}
              {!isLoading && (
                <button
                  className={styles.mobilePill}
                  onClick={handleAuthAction}
                  aria-label={user ? 'Me menu' : 'Sign in with Google'}
                >
                  {user ? 'Me' : 'Login'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Filters Popup Modal */}
      {isFiltersPopupOpen && onFilterChange && (
        <>
          <div className={styles.filtersOverlay} onClick={closeFiltersPopup}></div>
          <div className={styles.filtersPopup}>
            <div className={styles.filtersPopupHeader}>
              <h3>Search Filters</h3>
              <button 
                className={styles.closePopupButton}
                onClick={closeFiltersPopup}
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
            <div className={styles.filtersPopupContent}>
              <MapFilters
                onFilterChange={(filters) => {
                  onFilterChange(filters);
                }}
                onSearchLocationChange={onSearchLocationChange}
                searchLocation={searchLocation}
                initialFilters={initialFilters}
                inHeader={true}
                onClosePopup={() => setIsFiltersPopupOpen(false)}
              />
            </div>
          </div>
        </>
      )}

      {/* Account Popup Modal */}
      {isAccountPopupOpen && user && (
        <>
          <div className={styles.accountOverlay} onClick={closeAccountPopup}></div>
          <div className={styles.accountPopup}>
            <div className={styles.accountPopupHeader}>
              <h3>Account Menu</h3>
              <button 
                className={styles.closePopupButton}
                onClick={closeAccountPopup}
                aria-label="Close account menu"
              >
                ✕
              </button>
            </div>
            <div className={styles.accountPopupContent}>
              <button 
                className={styles.accountPopupItem}
                onClick={() => handleAccountMenuClick('/seller')}
              >
                <span className={styles.accountPopupIcon}>💼</span>
                <div className={styles.accountPopupText}>
                  <div className={styles.accountPopupTitle}>Sell</div>
                  <div className={styles.accountPopupSubtitle}>List your property</div>
                </div>
              </button>
              <button 
                className={styles.accountPopupItem}
                onClick={handleSignOut}
              >
                <span className={styles.accountPopupIcon}>🚪</span>
                <div className={styles.accountPopupText}>
                  <div className={styles.accountPopupTitle}>Sign Out</div>
                  <div className={styles.accountPopupSubtitle}>Sign out of your account</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
