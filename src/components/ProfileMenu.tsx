import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Auth.module.css';
import { useAuth } from '../context/AuthContext';

interface ProfileMenuProps {
  variant?: 'desktop' | 'mobile';
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ variant = 'desktop' }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    setIsOpen(false);
    router.push('/');
  };

  if (!user) {
    return (
      <div className={styles.authButtons}>
        <Link href="/login" className={styles.loginButton}>Sign In
        </Link>
        <Link href="/register" className={styles.registerButton}>Register
        </Link>
      </div>
    );
  }

  return (
    <div 
      className={`${styles.profileMenu} ${isOpen ? styles.open : ''} ${variant === 'mobile' ? styles.mobileVariant : ''}`}
      ref={menuRef}
    >
      <button 
        className={styles.profileButton}
        onClick={toggleMenu}
        aria-label="Open profile menu"
      >
        {user.profileImage ? (
          <img 
            src={user.profileImage} 
            alt={user.name} 
            className={styles.profileImage}
          />
        ) : (
          <div className={styles.profileInitials}>
            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        )}
        <span className={styles.profileName}>{user.name.split(' ')[0]}</span>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className={styles.dropdownMenu}>
        <div className={styles.menuHeader}>
          <p className={styles.userName}>{user.name}</p>
          <p className={styles.userEmail}>{user.email}</p>
        </div>

        <div className={styles.menuItems}>
          <Link href="/user/profile">
            <a className={styles.menuItem}>
              <span className={styles.menuItemIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              My Profile
            </a>
          </Link>

          <Link href="/saved-properties">
            <a className={styles.menuItem}>
              <span className={styles.menuItemIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              Saved Properties
            </a>
          </Link>

          <Link href="/recent-searches">
            <a className={styles.menuItem}>
              <span className={styles.menuItemIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              Recent Searches
            </a>
          </Link>

          <Link href="/seller">
            <a className={styles.menuItem}>
              <span className={styles.menuItemIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="9" y1="21" x2="9" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              My Listings
            </a>
          </Link>

          <a 
            href="#" 
            className={`${styles.menuItem} ${styles.logoutItem}`}
            onClick={handleLogout}
          >
            <span className={styles.menuItemIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            Log Out
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProfileMenu;
