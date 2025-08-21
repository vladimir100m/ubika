import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import PropertyCard from '../components/PropertyCard';
import styles from '../styles/Home.module.css';
import { getSavedProperties, unsaveProperty, type SavedProperty } from '../utils/savedPropertiesApi';

const SavedProperties: React.FC = () => {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Get operation from query parameters, default to 'buy'
  const operation = router.query.operation
    ? router.query.operation as 'buy' | 'rent'
    : 'buy';

  const handleOperationChange = (operation: 'buy' | 'rent') => {
    // Navigate to map page with operation filter instead of filtering saved properties
    router.push({
      pathname: '/map',
      query: { operation }
    });
  };

  // Load saved properties when user is authenticated
  useEffect(() => {
    const loadSavedProperties = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const savedProps = await getSavedProperties();
        setSavedProperties(savedProps);
      } catch (error) {
        console.error('Error loading saved properties:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading) {
      loadSavedProperties();
    }
  }, [user, isLoading]);

  // Handle favorite toggle
  const handleFavoriteToggle = async (propertyId: number, newStatus: boolean) => {
    if (!newStatus) {
      setSavedProperties(prev => prev.filter(prop => prop.id !== propertyId));
    }
  };

  if (isLoading || loading) return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
        </div>
      </main>
    </div>
  );
  
  // Note: useSession doesn't expose an error; only status and session object.

  if (!user) {
    return (
      <div className={styles.container}>
        <Header />
        <main className={styles.main}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
                Sign in to view your saved properties
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                Create an account or sign in to save your favorite properties and access them anytime.
              </p>
              <button
                onClick={() => signIn('google')}
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#0073e6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Sign In with Google
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ paddingTop: '80px' }}>
      <Header />
      
      {/* Page Header */}
      <div style={{ 
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e9ecef',
        padding: '20px 0'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '600', 
              margin: '0',
              color: '#2d3748'
            }}>
              My Saved Properties
            </h1>
            <p style={{ 
              margin: '4px 0 0 0', 
              color: '#718096',
              fontSize: '16px'
            }}>
              {savedProperties.length > 0 
                ? `You have ${savedProperties.length} saved ${savedProperties.length === 1 ? 'property' : 'properties'}`
                : 'Properties you save will appear here'
              }
            </p>
          </div>
          
          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                backgroundColor: '#0073e6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#005bb5'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0073e6'}
            >
              Browse Properties
            </button>
          </div>
        </div>
      </div>

      <main className={styles.main}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          {savedProperties.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '80px 20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ 
                fontSize: '64px', 
                marginBottom: '24px',
                opacity: 0.3 
              }}>
                🏠
              </div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                marginBottom: '16px', 
                color: '#666' 
              }}>
                No Saved Properties Yet
              </h2>
              <p style={{ 
                fontSize: '16px', 
                color: '#888', 
                marginBottom: '32px',
                maxWidth: '400px',
                margin: '0 auto 32px auto'
              }}>
                Start exploring properties and save your favorites by clicking the heart icon. 
                Your saved properties will appear here for easy access.
              </p>
              <button 
                onClick={() => router.push('/')}
                style={{ 
                  backgroundColor: '#0073e6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  padding: '14px 28px', 
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 115, 230, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#005bb5';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 115, 230, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0073e6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 115, 230, 0.2)';
                }}
              >
                Discover Properties
              </button>
            </div>
          ) : (
            <>
              {/* Filters and Sort */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '32px',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '16px', color: '#666', fontWeight: '500' }}>
                    {savedProperties.length} {savedProperties.length === 1 ? 'Property' : 'Properties'}
                  </span>
                </div>
                
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to clear all saved properties?')) {
                      try {
                        // Unsave all properties
                        await Promise.all(
                          savedProperties.map(property => unsaveProperty(property.id.toString()))
                        );
                        setSavedProperties([]);
                      } catch (error) {
                        console.error('Error clearing saved properties:', error);
                        alert('Failed to clear saved properties. Please try again.');
                      }
                    }
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#dc2626',
                    border: '1px solid #dc2626',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#dc2626';
                  }}
                >
                  Clear All
                </button>
              </div>

              {/* Properties Grid */}
              <div className={styles.propertiesGrid}>
                {savedProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isFavorite={true}
                    onFavoriteToggle={() => handleFavoriteToggle(property.id, false)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SavedProperties;
