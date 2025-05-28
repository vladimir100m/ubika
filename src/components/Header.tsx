import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';
import mobileStyles from '../styles/Mobile.module.css';
import ProfileMenu from './ProfileMenu';
import { useAuth } from '../context/AuthContext';
import useMediaQuery from '../utils/useMediaQuery';

interface HeaderProps {
  // Add any props if needed
}

const Header: React.FC<HeaderProps> = () => {
  const router = useRouter();
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <header className={`${styles.navbar} ${isMobile ? mobileStyles.onlyMobile : ''}`}>
      <div className={styles.logo} onClick={() => router.push('/')}>
        <Image src="/ubika-logo.png" alt="Ubika Logo" width={40} height={40} />
        <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>Ubika</span>
      </div>
      <div className={mobileStyles.onlyDesktop}>
        <nav className={styles.navigation}>
          <div className={styles.navLinks}>
            <Link href="/map">
              Buy
            </Link>
            {user && (
              <Link href="/recent-searches">
                Recent Searches
              </Link>
            )}
            <Link href="/map">
              Rent
            </Link>
            {user && (
              <Link href="/saved-properties">
                Saved Homes
              </Link>
            )}
            <Link href="/seller">
              Sell
            </Link>
          </div>
          <div className={styles.authSection}>
            <ProfileMenu variant="desktop" />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
