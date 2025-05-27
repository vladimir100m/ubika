import React from 'react';
import Link from 'next/link';
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
      <div className={styles.logo} onClick={() => router.push('/')}>Ubika</div>
      <div className={mobileStyles.onlyDesktop}>
        <nav className={styles.navigation}>
          <div className={styles.navLinks}>
            <Link href="#">
              <a>Buy</a>
            </Link>
            <Link href="#">
              <a>Rent</a>
            </Link>
            <Link href="/seller">
              <a>Sell</a>
            </Link>
            <Link href="#">
              <a>Mortgage</a>
            </Link>
            {user && (
              <>
                <Link href="/saved-properties">
                  <a>Saved Homes</a>
                </Link>
                <Link href="/recent-searches">
                  <a>Recent Searches</a>
                </Link>
              </>
            )}
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
