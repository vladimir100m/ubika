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
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogoClick = () => {
    router.push('/');
  };

  const handleAuthAction = () => {
    if (user) {
      setIsAccountDropdownOpen(!isAccountDropdownOpen);
    } else {
      signIn('google');
    }
  };

  const toggleAccountDropdown = () => {
    setIsAccountDropdownOpen(!isAccountDropdownOpen);
  };

  const closeAccountDropdown = () => {
    setIsAccountDropdownOpen(false);
  };

  const handleAccountMenuClick = (path: string) => {
    setIsAccountDropdownOpen(false);
    router.push(path);
  };

  const handleSignOut = () => {
    setIsAccountDropdownOpen(false);
    signOut();
  };

  const toggleFiltersPopup = () => {
    setIsFiltersPopupOpen(!isFiltersPopupOpen);
  };

  const closeFiltersPopup = () => {
    setIsFiltersPopupOpen(false);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isFiltersPopupOpen && !target.closest(`.${styles.filtersPopup}`) && !target.closest(`.${styles.filtersButton}`)) {
        closeFiltersPopup();
      }
      if (isAccountDropdownOpen && 
          !target.closest(`.${styles.accountDropdown}`) && 
          !target.closest(`.${styles.accountButton}`) &&
          !target.closest(`.${styles.mobileAccountDropdown}`) && 
          !target.closest(`.${styles.mobileAccountContainer}`)) {
        closeAccountDropdown();
      }
    };

    if (isFiltersPopupOpen || isAccountDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFiltersPopupOpen, isAccountDropdownOpen]);

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
            {/* Navigation Links - Rent, Buy, Sell */}
            <div className={styles.navLinks}>
              <button
                className={styles.navButton}
                onClick={() => handleNavigation('/map?operation=rent')}
                aria-label="Search rental properties"
              >
                <span className={styles.navButtonIcon} role="img" aria-hidden="true">🏠</span>
                Rent
              </button>
              <button
                className={styles.navButton}
                onClick={() => handleNavigation('/map?operation=buy')}
                aria-label="Search properties for sale"
              >
                <span className={styles.navButtonIcon} role="img" aria-hidden="true">🏡</span>
                Buy
              </button>
              <button
                className={styles.navButton}
                onClick={() => handleNavigation('/seller')}
                aria-label="Sell your property"
              >
                <span className={styles.navButtonIcon} role="img" aria-hidden="true">💼</span>
                Sell
              </button>
            </div>
            
            {/* Right Section - Filters and Auth */}
            <div className={styles.rightSection}>
              {showMapFilters && onFilterChange && (
                <button 
                  className={`${styles.filtersButton} ${isFiltersPopupOpen ? styles.active : ''}`}
                  onClick={toggleFiltersPopup}
                  aria-label="Open filters"
                >
                  <span className={styles.navButtonIcon} role="img" aria-hidden="true">🔍</span>
                  Filters
                </button>
              )}
              
              {!isLoading && (
                <div className={styles.accountContainer}>
                  <button 
                    onClick={handleAuthAction}
                    className={`${styles.navButton} ${styles.accountButton}`}
                    aria-label={user ? 'Account menu' : 'Sign in with Google'}
                  >
                    <span className={styles.navButtonIcon} role="img" aria-hidden="true">
                      {user ? '👤' : '🔑'}
                    </span>
                    {user ? 'Account' : 'Login'}
                    {user && (
                      <span className={styles.dropdownArrow}>
                        {isAccountDropdownOpen ? '▲' : '▼'}
                      </span>
                    )}
                  </button>
                  
                  {user && isAccountDropdownOpen && (
                    <div className={styles.accountDropdown}>
                      <button 
                        className={styles.dropdownItem}
                        onClick={() => handleAccountMenuClick('/account')}
                      >
                        <span className={styles.dropdownIcon}>👤</span>
                        Account
                      </button>
                      <button 
                        className={styles.dropdownItem}
                        onClick={() => handleAccountMenuClick('/saved-properties')}
                      >
                        <span className={styles.dropdownIcon}>❤️</span>
                        Saved Properties
                      </button>
                      <button 
                        className={styles.dropdownItem}
                        onClick={() => handleAccountMenuClick('/profile')}
                      >
                        <span className={styles.dropdownIcon}>📝</span>
                        Profile
                      </button>
                      <hr className={styles.dropdownDivider} />
                      <button 
                        className={styles.dropdownItem}
                        onClick={handleSignOut}
                      >
                        <span className={styles.dropdownIcon}>🚪</span>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>
        )}

        {/* Mobile Navigation */}
        {isMobile && (
          <div className={styles.mobileNavContainer}>
            <div className={styles.mobileNavScroll} role="navigation" aria-label="Mobile navigation">
              {/* Order: Rent, Buy, Sell, Filters, Account/Login */}
              <button
                className={styles.mobilePill}
                onClick={() => handleNavigation('/map?operation=rent')}
                aria-label="Search rental properties"
              >
                Rent
              </button>
              <button
                className={styles.mobilePill}
                onClick={() => handleNavigation('/map?operation=buy')}
                aria-label="Search properties for sale"
              >
                Buy
              </button>
              <button
                className={styles.mobilePill}
                onClick={() => handleNavigation('/seller')}
                aria-label="Sell your property"
              >
                Sell
              </button>
              {showMapFilters && onFilterChange && (
                <button
                  className={`${styles.mobilePill} ${isFiltersPopupOpen ? styles.active : ''}`}
                  onClick={toggleFiltersPopup}
                  aria-label="Open filters"
                >
                  🔍 Filters
                </button>
              )}
              {!isLoading && (
                <div className={styles.mobileAccountContainer}>
                  <button
                    className={`${styles.mobilePill} ${user && isAccountDropdownOpen ? styles.active : ''}`}
                    onClick={handleAuthAction}
                    aria-label={user ? 'Account menu' : 'Sign in with Google'}
                  >
                    {user ? 'Account' : 'Login'}
                    {user && (
                      <span className={styles.mobileDropdownArrow}>
                        {isAccountDropdownOpen ? '▲' : '▼'}
                      </span>
                    )}
                  </button>
                  
                  {user && isAccountDropdownOpen && (
                    <div className={styles.mobileAccountDropdown}>
                      <button 
                        className={styles.mobileDropdownItem}
                        onClick={() => handleAccountMenuClick('/account')}
                      >
                        <span className={styles.dropdownIcon}>👤</span>
                        Account
                      </button>
                      <button 
                        className={styles.mobileDropdownItem}
                        onClick={() => handleAccountMenuClick('/saved-properties')}
                      >
                        <span className={styles.dropdownIcon}>❤️</span>
                        Saved Properties
                      </button>
                      <button 
                        className={styles.mobileDropdownItem}
                        onClick={() => handleAccountMenuClick('/profile')}
                      >
                        <span className={styles.dropdownIcon}>📝</span>
                        Profile
                      </button>
                      <hr className={styles.dropdownDivider} />
                      <button 
                        className={styles.mobileDropdownItem}
                        onClick={handleSignOut}
                      >
                        <span className={styles.dropdownIcon}>🚪</span>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Filters Popup Modal */}
      {isFiltersPopupOpen && showMapFilters && onFilterChange && (
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
                inHeader={false}
                onClosePopup={() => setIsFiltersPopupOpen(false)}
              />
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
