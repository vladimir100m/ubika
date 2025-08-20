import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSession, signIn, signOut } from 'next-auth/react';
import styles from '../styles/Home.module.css';
import mobileStyles from '../styles/Mobile.module.css';
import useMediaQuery from '../utils/useMediaQuery';

interface HeaderProps {
  // Add any props if needed
}

const Header: React.FC<HeaderProps> = () => {
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
          <Image src="/ubika-logo.png" alt="Ubika Logo" width={40} height={40} />
          <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>Ubika</span>
        </div>
        <nav className={styles.navigation} style={{ flex: 1 }}>
          <div className={styles.navLinks} style={{ display: 'flex', alignItems: 'center', gap: '18px', justifyContent: 'flex-start' }}>
            <Link href="/map" legacyBehavior>
              <a className={styles.navItem}><span role="img" aria-label="Rent" style={{ marginRight: '6px' }}>�</span>Rent</a>
            </Link>
            <Link href="/map" legacyBehavior>
              <a className={styles.navItem}><span role="img" aria-label="Buy" style={{ marginRight: '6px' }}>�</span>Buy</a>
            </Link>
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
