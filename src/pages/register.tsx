import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import mobileStyles from '../styles/Mobile.module.css';
import useMediaQuery from '../utils/useMediaQuery';
import { useAuth } from '../context/AuthContext';
import MobileNavigation from '../components/MobileNavigation';

const Register: React.FC = () => {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { register, loading, error } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    let valid = true;
    const newErrors = { ...formErrors };
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }
    
    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }
    
    setFormErrors(newErrors);
    return valid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      await register(formData.name, formData.email, formData.password);
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
          <h1 className={styles.authTitle}>Create an Account</h1>
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={styles.formInput}
              />
              {formErrors.name && <span className={styles.fieldError}>{formErrors.name}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.formInput}
              />
              {formErrors.email && <span className={styles.fieldError}>{formErrors.email}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles.formInput}
              />
              {formErrors.password && <span className={styles.fieldError}>{formErrors.password}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={styles.formInput}
              />
              {formErrors.confirmPassword && <span className={styles.fieldError}>{formErrors.confirmPassword}</span>}
            </div>
            
            <div className={styles.termsCheckbox}>
              <input 
                type="checkbox" 
                id="terms" 
                required
              />
              <label htmlFor="terms">
                I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
              </label>
            </div>
            
            <button 
              type="submit" 
              className={styles.authButton}
              disabled={loading}
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </form>
          
          <div className={styles.authLinks}>
            <p>
              Already have an account? <Link href="/login">Log In</Link>
            </p>
          </div>
        </div>
      </div>
      
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default Register;
