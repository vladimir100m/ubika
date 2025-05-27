import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import authStyles from '../styles/Auth.module.css';
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
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
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
      try {
        await register(formData.name, formData.email, formData.password);
      } catch (error) {
        // Error is handled by the AuthContext
      }
    }
  };
  
  const handleSocialSignup = (provider: string) => {
    // In a real app, we would implement OAuth registration
    console.log(`Signing up with ${provider}`);
    // For demo purposes, let's just show an alert
    alert(`${provider} signup would be implemented in a real application`);
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
      
      <div className={authStyles.authContainer}>
        <div className={authStyles.authCard}>
          <h1 className={authStyles.authTitle}>Create Your Account</h1>
          <p className={authStyles.authSubtitle}>
            Join Ubika to find your dream property and save your favorites
          </p>
          
          <div className={authStyles.socialLogin}>
            <button 
              className={`${authStyles.socialButton} ${authStyles.googleButton}`}
              onClick={() => handleSocialSignup('Google')}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.549 3.921 1.453l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" fill="currentColor" />
              </svg>
              Sign up with Google
            </button>
            
            <button 
              className={`${authStyles.socialButton} ${authStyles.facebookButton}`}
              onClick={() => handleSocialSignup('Facebook')}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M20.007 3H3.993A.993.993 0 003 3.993v16.013c0 .55.444.994.993.994h8.621v-6.971h-2.346v-2.717h2.346V9.31c0-2.325 1.42-3.591 3.494-3.591.993 0 1.847.073 2.096.106v2.43h-1.438c-1.128 0-1.346.537-1.346 1.324v1.734h2.69l-.35 2.717h-2.34V21h4.587a.993.993 0 00.993-.993V3.993A.993.993 0 0020.007 3z" fill="currentColor" />
              </svg>
              Sign up with Facebook
            </button>
          </div>
          
          <div className={authStyles.separator}>or sign up with email</div>
          
          {error && (
            <div className={authStyles.errorMessage}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={authStyles.authForm}>
            <div className={authStyles.formGroup}>
              <label htmlFor="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={authStyles.formInput}
                placeholder="John Doe"
              />
              {formErrors.name && <span className={authStyles.fieldError}>{formErrors.name}</span>}
            </div>
            
            <div className={authStyles.formGroup}>
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={authStyles.formInput}
                placeholder="your.email@example.com"
              />
              {formErrors.email && <span className={authStyles.fieldError}>{formErrors.email}</span>}
            </div>
            
            <div className={authStyles.formGroup}>
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={authStyles.formInput}
                placeholder="Create a password (min. 8 characters)"
              />
              {formErrors.password && <span className={authStyles.fieldError}>{formErrors.password}</span>}
            </div>
            
            <div className={authStyles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={authStyles.formInput}
                placeholder="Confirm your password"
              />
              {formErrors.confirmPassword && <span className={authStyles.fieldError}>{formErrors.confirmPassword}</span>}
            </div>
            
            <div className={authStyles.termsCheckbox}>
              <input 
                type="checkbox" 
                id="terms" 
                required
              />
              <label htmlFor="terms">
                I agree to Ubika's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
              </label>
            </div>
            
            <button 
              type="submit" 
              className={authStyles.authButton}
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          
          <div className={authStyles.authLinks}>
            <p>
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
      
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default Register;
