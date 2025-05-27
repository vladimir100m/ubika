import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import resetStyles from '../styles/ResetPassword.module.css';
import mobileStyles from '../styles/Mobile.module.css';
import useMediaQuery from '../utils/useMediaQuery';
import { useAuth } from '../context/AuthContext';
import MobileNavigation from '../components/MobileNavigation';

const ResetPassword: React.FC = () => {
  const router = useRouter();
  const { token } = router.query;
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { resetPassword, loading, error } = useAuth();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    // If no token is provided, redirect to forgot-password
    if (router.isReady && !token) {
      router.push('/forgot-password');
    }
  }, [router, token]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateForm = () => {
    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }
    setFormError('');
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await resetPassword(token as string, formData.password);
      setSuccess(true);
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
          
          {formError && (
            <div className={styles.errorMessage}>
              {formError}
            </div>
          )}
          
          {success ? (
            <div className={resetStyles.successMessage}>
              <p>Your password has been successfully reset!</p>
              <p>You can now <Link href="/login">log in</Link> with your new password.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.authForm}>
              <div className={styles.formGroup}>
                <label htmlFor="password">New Password</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={styles.formInput}
                  minLength={8}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={styles.formInput}
                />
              </div>
              
              <button 
                type="submit" 
                className={styles.authButton}
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
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

export default ResetPassword;
