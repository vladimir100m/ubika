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
      <div className={styles.logo} onClick={() => router.push('/')}> 
        <Image src="/ubika-logo.png" alt="Ubika Logo" width={40} height={40} />
        <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>Ubika</span>
      </div>
      {/* Desktop Navigation */}
      <div className={mobileStyles.onlyDesktop}>
        <nav className={styles.navigation}>
          <div className={styles.navLinks}>
            <Link href="/map">Buy</Link>
            <Link href="/map">Rent</Link>
            {!isLoading && (
              <React.Fragment>
                {user ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* ...existing code for user dropdown... */}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '15px' }}>
                    {/* ...existing code for sign in/join... */}
                  </div>
                )}
              </React.Fragment>
            )}
          </div>
        </nav>
      </div>
      {/* Mobile Navigation */}
      <div className={mobileStyles.onlyMobile}>
        <nav className={mobileStyles.mobileNavigation}>
          <Link href="/map" legacyBehavior><a className={mobileStyles.navItem}><span className={mobileStyles.navIcon}>🏠</span><span>Buy</span></a></Link>
          <Link href="/map" legacyBehavior><a className={mobileStyles.navItem}><span className={mobileStyles.navIcon}>🏡</span><span>Rent</span></a></Link>
          {!isLoading && (
            <React.Fragment>
              {user ? (
                <Link href="/account" legacyBehavior><a className={mobileStyles.navItem}><span className={mobileStyles.navIcon}>👤</span><span>Account</span></a></Link>
              ) : (
                <button 
                  onClick={() => signIn('google')} 
                  className={mobileStyles.navItem}
                  style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' }}
                >
                  <span className={mobileStyles.navIcon}>🔑</span><span>Login</span>
                </button>
              )}
            </React.Fragment>
          )}
        </nav>
      </div>
    </header>
        </nav>
      </div>
    </header>
  );
};

export default Header;
