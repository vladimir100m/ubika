import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import resetStyles from '../styles/ResetPassword.module.css';
import mobileStyles from '../styles/Mobile.module.css';
import useMediaQuery from '../utils/useMediaQuery';
import { useAuth } from '../context/AuthContext';
import MobileNavigation from '../components/MobileNavigation';

const ForgotPassword: React.FC = () => {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { requestPasswordReset, loading, error } = useAuth();
  
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
      setSuccessMessage(`If an account exists for ${email}, we've sent password reset instructions.`);
    } catch (err) {
      // Error handling is managed by the AuthContext
    }
  };
  
  return (
    <div className={styles.container}>
      <header className={`${styles.navbar} ${isMobile ? mobileStyles.onlyMobile : ''}`}>
        <div className={styles.logo} onClick={() => router.push('/')}>Ubika</div>
        <div className={mobileStyles.onlyDesktop}>
          <nav>
            <a href="#">Buy</a>
            <a href="#">Rent</a>
            <a href="/seller">Sell</a>
            <a href="#">Mortgage</a>
            <a href="/login">Log In</a>
          </nav>
        </div>
      </header>
      
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>Reset Your Password</h1>
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className={resetStyles.successMessage}>
              {successMessage}
            </div>
          )}
          
          {!submitted ? (
            <>
              <p className={resetStyles.forgotPasswordInstructions}>
                Enter your email address and we'll send you instructions to reset your password.
              </p>
              
              <form onSubmit={handleSubmit} className={styles.authForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={styles.formInput}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className={styles.authButton}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Reset Password'}
                </button>
              </form>
            </>
          ) : (
            <div className={resetStyles.resetSent}>
              <p>Check your email for a link to reset your password.</p>
              <p>If it doesn't appear within a few minutes, check your spam folder.</p>
            </div>
          )}
          
          <div className={styles.authLinks}>
            <p>
              <Link href="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
      
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default ForgotPassword;
