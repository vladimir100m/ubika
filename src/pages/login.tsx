import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import authStyles from '../styles/Auth.module.css';
import mobileStyles from '../styles/Mobile.module.css';
import useMediaQuery from '../utils/useMediaQuery';
import { useAuth } from '../context/AuthContext';
import MobileNavigation from '../components/MobileNavigation';

const Login: React.FC = () => {
  const router = useRouter();
  const { redirect } = router.query;
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { login, loading, error } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      // If there's a redirect parameter, navigate there after login
      if (redirect && typeof redirect === 'string') {
        router.push(redirect);
      }
    } catch (error) {
      // Error is handled by the AuthContext
    }
  };
  
  const handleSocialLogin = (provider: string) => {
    // In a real app, we would implement OAuth login
    console.log(`Logging in with ${provider}`);
    // For demo purposes, let's just show an alert
    alert(`${provider} login would be implemented in a real application`);
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
            <a href="/register">Sign Up</a>
          </nav>
        </div>
      </header>
      
      <div className={authStyles.authContainer}>
        <div className={authStyles.authCard}>
          <h1 className={authStyles.authTitle}>Welcome Back</h1>
          <p className={authStyles.authSubtitle}>
            Sign in to access your account and continue your property search
          </p>
          
          <div className={authStyles.socialLogin}>
            <button 
              className={`${authStyles.socialButton} ${authStyles.googleButton}`}
              onClick={() => handleSocialLogin('Google')}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.549 3.921 1.453l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" fill="currentColor" />
              </svg>
              Continue with Google
            </button>
            
            <button 
              className={`${authStyles.socialButton} ${authStyles.facebookButton}`}
              onClick={() => handleSocialLogin('Facebook')}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M20.007 3H3.993A.993.993 0 003 3.993v16.013c0 .55.444.994.993.994h8.621v-6.971h-2.346v-2.717h2.346V9.31c0-2.325 1.42-3.591 3.494-3.591.993 0 1.847.073 2.096.106v2.43h-1.438c-1.128 0-1.346.537-1.346 1.324v1.734h2.69l-.35 2.717h-2.34V21h4.587a.993.993 0 00.993-.993V3.993A.993.993 0 0020.007 3z" fill="currentColor" />
              </svg>
              Continue with Facebook
            </button>
            
            <button 
              className={`${authStyles.socialButton} ${authStyles.appleButton}`}
              onClick={() => handleSocialLogin('Apple')}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.45-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.47C2.23 14.73 3.14 6.5 8.8 6.5c1.63-.03 2.77.95 3.49.95.72 0 2.06-1.17 3.71-.99.63.03 2.38.26 3.52 1.94-2.06 1.28-1.73 4.39.48 5.47-.62 1.53-1.42 3.02-2.95 4.41zM12.77 6.3c-.19-1.73 1.34-3.61 3.2-3.8 0 2.67-2.4 3.77-3.2 3.8z" fill="currentColor" />
              </svg>
              Continue with Apple
            </button>
          </div>
          
          <div className={authStyles.separator}>or sign in with email</div>
          
          {error && (
            <div className={authStyles.errorMessage}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={authStyles.authForm}>
            <div className={authStyles.formGroup}>
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={authStyles.formInput}
                placeholder="your.email@example.com"
              />
            </div>
            
            <div className={authStyles.formGroup}>
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={authStyles.formInput}
                placeholder="Your password"
              />
            </div>
            
            <div className={authStyles.termsCheckbox}>
              <input 
                type="checkbox" 
                id="remember-me" 
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <label htmlFor="remember-me">
                Remember me on this device
              </label>
            </div>
            
            <button 
              type="submit" 
              className={authStyles.authButton}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className={authStyles.authLinks}>
            <p>
              <Link href="/forgot-password">Forgot your password?</Link>
            </p>
            <p>
              Don't have an account? <Link href="/register">Create one now</Link>
            </p>
          </div>
        </div>
      </div>
      
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default Login;
      </div>
      
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default Login;
