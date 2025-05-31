import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import styles from '../styles/Home.module.css';

function Profile() {
  const { user, error, isLoading } = useUser();
  const [favorites, setFavorites] = useState<number[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login if not authenticated
      router.push('/api/auth/login');
      return;
    }
    
    if (user) {
      // Load user's favorites from localStorage
      const userFavorites = JSON.parse(localStorage.getItem(`favorites_${user.sub}`) || '[]');
      setFavorites(userFavorites);
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '32px' }}>
            My Profile
          </h1>
          
          {user && (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              padding: '32px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                {user.picture && (
                  <img 
                    src={user.picture} 
                    alt="Profile" 
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                )}
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
                    {user.name}
                  </h2>
                  <p style={{ color: '#666', fontSize: '16px' }}>
                    {user.email}
                  </p>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #e9e9e9', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
                  Account Information
                </h3>
                
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '500' }}>Name:</span>
                    <span>{user.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '500' }}>Email:</span>
                    <span>{user.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '500' }}>Email Verified:</span>
                    <span>{user.email_verified ? 'Yes' : 'No'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '500' }}>Member Since:</span>
                    <span>{new Date(user.updated_at || '').toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '500' }}>Saved Properties:</span>
                    <span>{favorites.length}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e9e9e9' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button 
                    onClick={() => window.location.href = '/saved-properties'}
                    style={{ 
                      backgroundColor: '#1277e1', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      padding: '12px 24px', 
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    View Saved Properties
                  </button>
                  <button 
                    onClick={() => window.location.href = '/api/auth/logout'}
                    style={{ 
                      backgroundColor: 'white', 
                      color: '#2a2a33', 
                      border: '1px solid #a7a6ab', 
                      borderRadius: '4px', 
                      padding: '12px 24px', 
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// This will redirect to login if the user is not authenticated
export default Profile;
