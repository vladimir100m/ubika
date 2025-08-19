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
    <header className={`${styles.navbar} ${isMobile ? mobileStyles.onlyMobile : ''}`}>
      <div className={styles.logo} onClick={() => router.push('/')}>
        <Image src="/ubika-logo.png" alt="Ubika Logo" width={40} height={40} />
        <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>Ubika</span>
      </div>
      <div className={mobileStyles.onlyDesktop}>
        <nav className={styles.navigation}>
          <div className={styles.navLinks}>
            <Link href="/map">Buy</Link>
            <Link href="/map">Rent</Link>

            {!isLoading && (
              <>
                {user ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ position: 'relative' }} ref={dropdownRef}>
                      <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          transition: 'background-color 0.2s ease',
                          backgroundColor: isDropdownOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        }}
                      >
                        {user.image && (
                          <Image src={user.image as string} alt="Profile" width={32} height={32} style={{ borderRadius: '50%' }} />
                        )}
                        <span style={{ fontSize: '14px', color: 'white' }}>{user.name}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', stroke: 'white' }}>
                          <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>

                      {isDropdownOpen && (
                        <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '8px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)', zIndex: 1000, minWidth: '280px', overflow: 'hidden' }}>
                          {profileMenuItems.map((item, index) => (
                            <button key={index} onClick={item.action} style={{ width: '100%', padding: '16px 20px', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '16px', color: '#374151', borderBottom: index < profileMenuItems.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background-color 0.2s ease' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f8f9fa'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                                <span>{item.label}</span>
                              </div>
                              {item.badge && <span style={{ backgroundColor: '#ff6b35', color: 'white', fontSize: '12px', fontWeight: '600', padding: '4px 8px', borderRadius: '4px' }}>{item.badge}</span>}
                            </button>
                          ))}

                          <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '8px' }}>
                            <button onClick={() => signOut()} style={{ width: '100%', padding: '16px 20px', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '16px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '12px' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#fef2f2'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
                              <span style={{ fontSize: '18px' }}>🚪</span>
                              <span>Sign out</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button 
                      onClick={() => signIn('google')} 
                      style={{ 
                        background: 'none',
                        border: 'none',
                        color: '#007bff', 
                        cursor: 'pointer',
                        fontSize: '14px', 
                        fontWeight: '500' 
                      }}
                    >
                      Sign in
                    </button>
                    <button 
                      onClick={() => signIn('google')} 
                      style={{ 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        border: 'none',
                        padding: '8px 16px', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontSize: '14px', 
                        fontWeight: '500' 
                      }}
                    >
                      Join
                    </button>
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
