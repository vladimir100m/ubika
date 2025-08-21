import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signIn, signOut } from 'next-auth/react';
import styles from '../styles/Home.module.css';
import mobileStyles from '../styles/Mobile.module.css';
import useMediaQuery from '../utils/useMediaQuery';
import MapFilters, { FilterOptions } from './MapFilters';

interface HeaderProps {
  showMapFilters?: boolean;
  onFilterChange?: (filters: FilterOptions) => void;
  initialFilters?: Partial<FilterOptions>;
}

const Header: React.FC<HeaderProps> = ({ showMapFilters = false, onFilterChange, initialFilters }) => {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';

  return (
    <>
    <header className={styles.navbar}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <div className={styles.logo} onClick={() => router.push('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', marginRight: isMobile ? '8px' : '16px' }}>
          <img 
            src="/ubika-logo.png" 
            alt="Ubika Logo" 
            width={isMobile ? 32 : 40} 
            height={isMobile ? 32 : 40}
            loading="eager"
            style={{ display: 'block' }}
          />
          {!isMobile && <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>Ubika</span>}
        </div>
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className={styles.navigation} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div className={styles.navLinks} style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
              <button
                className={styles.navItem}
                style={{ background: 'none', color: '#fff', border: '1px solid #fff', borderRadius: '6px', padding: '6px 18px', display: 'flex', alignItems: 'center', fontWeight: '500', cursor: 'pointer' }}
                onClick={() => router.push('/map?operation=rent')}
              >
                <span role="img" aria-label="Rent" style={{ marginRight: '6px' }}>🏠</span>Rent
              </button>
              <button
                className={styles.navItem}
                style={{ background: 'none', color: '#fff', border: '1px solid #fff', borderRadius: '6px', padding: '6px 18px', display: 'flex', alignItems: 'center', fontWeight: '500', cursor: 'pointer' }}
                onClick={() => router.push('/map?operation=buy')}
              >
                <span role="img" aria-label="Buy" style={{ marginRight: '6px' }}>🏡</span>Buy
              </button>
              <button
                className={styles.navItem}
                style={{ background: 'none', color: '#fff', border: '1px solid #fff', borderRadius: '6px', padding: '6px 18px', display: 'flex', alignItems: 'center', fontWeight: '500', cursor: 'pointer' }}
                onClick={() => router.push('/seller')}
              >
                <span role="img" aria-label="Sell" style={{ marginRight: '6px' }}>💼</span>Sell
              </button>
            </div>
            
            {/* Right side - Map Filters and Account */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
              {showMapFilters && onFilterChange && (
                <div style={{ transform: 'scale(0.9)' }}>
                  <MapFilters
                    onFilterChange={onFilterChange}
                    initialFilters={initialFilters}
                    inHeader={true}
                  />
                </div>
              )}
              
              {!isLoading && (
                <React.Fragment>
                  {user ? (
                    <Link href="/account" legacyBehavior>
                      <a className={styles.navItem}><span role="img" aria-label="Account" style={{ marginRight: '6px' }}>👤</span>Account</a>
                    </Link>
                  ) : (
                    <button 
                      onClick={() => signIn('google')}
                      className={styles.navItem}
                      style={{ background: 'none', border: '1px solid #fff', color: '#fff', cursor: 'pointer', fontSize: '1rem', fontWeight: '500', padding: '6px 18px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                    >
                      <span role="img" aria-label="Login" style={{ marginRight: '8px' }}>🔑</span>Login
                    </button>
                  )}
                </React.Fragment>
              )}
            </div>
          </nav>
        )}

        {/* Mobile Navigation - Horizontal Scrollable Pills */}
        {isMobile && (
          <div className={styles.mobileNavContainer}>
            <div className={styles.mobileNavScroll}>
              <button
                className={styles.mobilePill}
                onClick={() => router.push('/map?operation=rent')}
              >
                Rent
              </button>
              <button
                className={styles.mobilePill}
                onClick={() => router.push('/map?operation=buy')}
              >
                Buy
              </button>
              <button
                className={styles.mobilePill}
                onClick={() => router.push('/seller')}
              >
                Sell
              </button>
              {!isLoading && (
                user ? (
                  <button
                    className={styles.mobilePill}
                    onClick={() => router.push('/account')}
                  >
                    Account
                  </button>
                ) : (
                  <button
                    className={styles.mobilePill}
                    onClick={() => signIn('google')}
                  >
                    Login
                  </button>
                )
              )}
              {showMapFilters && onFilterChange && (
                <div style={{ marginLeft: 'auto', transform: 'scale(0.8)' }}>
                  <MapFilters
                    onFilterChange={onFilterChange}
                    initialFilters={initialFilters}
                    inHeader={true}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
    </>
  );
};

export default Header;
