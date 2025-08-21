import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signIn, signOut } from 'next-auth/react';
import styles from '../styles/Home.module.css';
import mobileStyles from '../styles/Mobile.module.css';
import useMediaQuery from '../utils/useMediaQuery';

interface HeaderProps {
  selectedOperation: 'buy' | 'rent';
  onOperationChange: (operation: 'buy' | 'rent') => void;
}

const Header: React.FC<HeaderProps> = ({ selectedOperation, onOperationChange }) => {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const profileMenuItems = [
    { label: 'Saved homes', icon: '🏠', action: () => { router.push('/saved-properties'); setIsDropdownOpen(false); } },
    { label: 'Saved searches', icon: '🔍', action: () => { console.log('Saved searches'); setIsDropdownOpen(false); } },
    { label: 'Manage listings', icon: '🏢', action: () => { router.push('/seller'); setIsDropdownOpen(false); } },
    { label: 'Inbox', icon: '💬', badge: 'NEW', action: () => { console.log('Inbox'); setIsDropdownOpen(false); } },
    { label: 'Manage tours', icon: '📅', action: () => { console.log('Manage tours'); setIsDropdownOpen(false); } },
    { label: 'Recently Viewed', icon: '👁️', action: () => { console.log('Recently viewed'); setIsDropdownOpen(false); } },
    { label: 'Your team', icon: '👥', action: () => { console.log('Your team'); setIsDropdownOpen(false); } },
    { label: 'Your home', icon: '🏡', action: () => { console.log('Your home'); setIsDropdownOpen(false); } },
    { label: 'Renter Hub', icon: '🔑', action: () => { console.log('Renter Hub'); setIsDropdownOpen(false); } },
    { label: 'Account settings', icon: '⚙️', action: () => { router.push('/account'); setIsDropdownOpen(false); } },
  ];
  
  return (
    <header className={styles.navbar}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <div className={styles.logo} onClick={() => router.push('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', marginRight: '32px' }}>
          <img 
            src="/ubika-logo.png" 
            alt="Ubika Logo" 
            width={40} 
            height={40}
            loading="eager"
            style={{ display: 'block' }}
          />
          <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>Ubika</span>
        </div>
        <nav className={styles.navigation} style={{ flex: 1 }}>
          <div className={styles.navLinks} style={{ display: 'flex', alignItems: 'center', gap: '18px', justifyContent: 'flex-start' }}>
            <button
              className={styles.navItem}
              style={{ background: selectedOperation === 'rent' ? '#fff' : 'none', color: selectedOperation === 'rent' ? '#0070f3' : '#fff', border: '1px solid #fff', borderRadius: '6px', padding: '6px 18px', display: 'flex', alignItems: 'center', fontWeight: '500', cursor: 'pointer' }}
              onClick={() => {
                onOperationChange('rent');
              }}
            >
              <span role="img" aria-label="Rent" style={{ marginRight: '6px' }}>🏡</span>Rent
            </button>
            <button
              className={styles.navItem}
              style={{ background: selectedOperation === 'buy' ? '#fff' : 'none', color: selectedOperation === 'buy' ? '#0070f3' : '#fff', border: '1px solid #fff', borderRadius: '6px', padding: '6px 18px', display: 'flex', alignItems: 'center', fontWeight: '500', cursor: 'pointer' }}
              onClick={() => {
                onOperationChange('buy');
              }}
            >
              <span role="img" aria-label="Buy" style={{ marginRight: '6px' }}>🏠</span>Buy
            </button>
            <button
              className={styles.navItem}
              style={{ background: 'none', color: '#fff', border: '1px solid #fff', borderRadius: '6px', padding: '6px 18px', display: 'flex', alignItems: 'center', fontWeight: '500', cursor: 'pointer' }}
              onClick={() => router.push('/seller')}
            >
              <span role="img" aria-label="Sell" style={{ marginRight: '6px' }}>💼</span>Sell
            </button>
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
      </div>
    </header>
  // ...existing code...
  );
};

export default Header;
