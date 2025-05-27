import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Mobile.module.css';
import { useAuth } from '../context/AuthContext';

interface MobileNavigationProps {
  // Add any props if needed
}

const MobileNavigation: React.FC<MobileNavigationProps> = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  // Determine which navigation item is active based on the current route
  const isActive = (path: string) => {
    return router.pathname === path;
  };
  
  return (
    <nav className={styles.mobileNavigation}>
      <Link href="/">
        <a className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}>
          <div className={styles.navIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>Home</span>
        </a>
      </Link>
      
      <Link href="/map">
        <a className={`${styles.navItem} ${isActive('/map') ? styles.active : ''}`}>
          <div className={styles.navIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>Map</span>
        </a>
      </Link>
      
      <Link href={user ? "/saved-properties" : "/login?redirect=/saved-properties"}>
        <a className={`${styles.navItem} ${isActive('/saved-properties') ? styles.active : ''}`}>
          <div className={styles.navIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>Saved</span>
        </a>
      </Link>
      
      <Link href="/search">
        <a className={`${styles.navItem} ${isActive('/search') ? styles.active : ''}`}>
          <div className={styles.navIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>Search</span>
        </a>
      </Link>
      
      <Link href={user ? "/profile" : "/login"}>
        <a className={`${styles.navItem} ${isActive('/profile') || isActive('/login') ? styles.active : ''}`}>
          <div className={styles.navIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>{user ? 'Profile' : 'Login'}</span>
        </a>
      </Link>
    </nav>
  );
};

export default MobileNavigation;