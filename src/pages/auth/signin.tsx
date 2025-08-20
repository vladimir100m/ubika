import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import styles from '../../styles/Home.module.css';

const SignIn: React.FC = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    
    try {
      await signIn('google', {
        callbackUrl: (router.query.callbackUrl as string) || '/',
      });
    } catch (error) {
      setError('An error occurred during Google sign in');
      setGoogleLoading(false);
    }
  };

  return (
    <div className={styles.container}>
  <Header selectedOperation="buy" onOperationChange={() => {}} />
      
      <main className={styles.main}>
        <div style={{ maxWidth: '400px', margin: '60px auto', padding: '40px 20px' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '600', 
              marginBottom: '8px',
              textAlign: 'center',
              color: '#2d3748'
            }}>
              Welcome to Ubika
            </h1>
            <p style={{ 
              textAlign: 'center',
              color: '#718096',
              marginBottom: '32px'
            }}>
              Sign in to save properties and manage your listings
            </p>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                backgroundColor: '#fff',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: googleLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease',
                color: '#3c4043'
              }}
              onMouseEnter={(e) => {
                if (!googleLoading) {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (!googleLoading) {
                  e.currentTarget.style.backgroundColor = '#fff';
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </button>

            {error && (
              <div style={{
                color: '#dc2626',
                fontSize: '14px',
                marginTop: '16px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <div style={{ 
              borderTop: '1px solid #e5e7eb',
              paddingTop: '24px',
              marginTop: '32px',
              textAlign: 'center'
            }}>
              <button
                onClick={() => router.push('/')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0073e6',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignIn;
