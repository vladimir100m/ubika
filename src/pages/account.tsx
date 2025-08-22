import React from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import styles from '../styles/Home.module.css';
import layoutStyles from '../styles/Layout.module.css';

const AccountSettings: React.FC = () => {
  const { data: session, status } = useSession();
  const user = session?.user;
  // Extend NextAuth user with optional fields from providers like Auth0/Google
  const u = user as (typeof user & { picture?: string | null; sub?: string; email_verified?: boolean; updated_at?: string | number | Date });
  const isLoading = status === 'loading';
  const router = useRouter();

  if (isLoading) return <div>Loading...</div>;
  // Note: useSession doesn't expose an error field; handle auth states via `status`.

  if (!user) {
    return (
      <div className={layoutStyles.pageContainer}>
  <Header />
        <div className={layoutStyles.pageContent}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
                Sign in to access your account settings
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                Manage your profile, preferences, and account information.
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
        </div>
      </div>
    );
  }

  return (
    <div className={layoutStyles.pageContainer}>
  <Header />
      <div className={layoutStyles.pageContent}>
      
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
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '600', 
              margin: '0',
              color: '#2d3748'
            }}>
              Account Settings
            </h1>
            <p style={{ 
              margin: '4px 0 0 0', 
              color: '#718096',
              fontSize: '16px'
            }}>
              Manage your profile and account preferences
            </p>
          </div>
        </div>
      </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
              {((u?.picture || u?.image) as string | undefined) && (
                <img 
                  src={(u?.picture || u?.image) as string} 
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
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontWeight: '500' }}>Name:</span>
                  <span>{user.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontWeight: '500' }}>Email:</span>
                  <span>{user.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontWeight: '500' }}>Email Verified:</span>
                  <span style={{ color: u?.email_verified ? '#10b981' : '#ef4444' }}>
                    {u?.email_verified ? '✓ Verified' : '✗ Not Verified'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontWeight: '500' }}>Member Since:</span>
                  <span>{u?.updated_at ? new Date(u.updated_at).toLocaleDateString() : '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontWeight: '500' }}>Last Updated:</span>
                  <span>{u?.updated_at ? new Date(u.updated_at).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e9e9e9' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
                Account Actions
              </h3>
              
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => router.push('/saved-properties')}
                  style={{ 
                    backgroundColor: '#0073e6', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    padding: '12px 24px', 
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#005bb5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0073e6'}
                >
                  View Saved Properties
                </button>
                
                <button 
                  onClick={() => window.location.href = '/api/auth/signout'}
                  style={{ 
                    backgroundColor: '#dc2626', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    padding: '12px 24px', 
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Privacy & Security Section */}
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e9e9e9' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
                Privacy & Security
              </h3>
              
              <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                  Your account is secured through Auth0. To modify your personal information, 
                  update your password, or manage two-factor authentication, please visit your 
                  Auth0 profile settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
