import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useUser } from '@auth0/nextjs-auth0/client';
import styles from '../styles/Home.module.css';
import mobileStyles from '../styles/Mobile.module.css';
import useMediaQuery from '../utils/useMediaQuery';

interface HeaderProps {
  // Add any props if needed
}

const Header: React.FC<HeaderProps> = () => {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { user, error, isLoading } = useUser();
  
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
            <Link href="/map">
              Rent
            </Link>
            <Link href="/profile?tab=sell">
              Sell
            </Link>
            {/* Auth0 Login/Logout */}
            {!isLoading && (
              <>
                {user ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Link href="/saved-properties">
                      Saved
                    </Link>
                    <Link href="/profile">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        {user.picture && (
                          <Image 
                            src={user.picture} 
                            alt="Profile" 
                            width={32} 
                            height={32} 
                            style={{ borderRadius: '50%' }}
                          />
                        )}
                        <span style={{ fontSize: '14px', color: '#333' }}>
                          {user.name}
                        </span>
                      </div>
                    </Link>
                    <a 
                      href="/api/auth/logout"
                      style={{ 
                        color: '#007bff', 
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Sign out
                    </a>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <a 
                      href="/api/auth/login"
                      style={{ 
                        color: '#007bff', 
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Sign in
                    </a>
                    <a 
                      href="/api/auth/login"
                      style={{ 
                        backgroundColor: '#007bff',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Join
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
