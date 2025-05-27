import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Home.module.css';
import mobileStyles from '../../styles/Mobile.module.css';
import MobileNavigation from '../../components/MobileNavigation';
import useMediaQuery from '../../utils/useMediaQuery';
import { useAuth } from '../../context/AuthContext';

const UserProfile: React.FC = () => {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [favoritesCount, setFavoritesCount] = useState(0);
  const { user, updateUser, logout, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notificationPreferences: {
      email: true,
      sms: false,
      app: true
    }
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        notificationPreferences: user.notificationPreferences
      });
    }
  }, [user]);

  useEffect(() => {
    // Load favorites count from localStorage
    try {
      const savedFavorites = localStorage.getItem('favorites');
      if (savedFavorites) {
        const favs = JSON.parse(savedFavorites);
        setFavoritesCount(favs.length);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationPreferenceChange = (type: 'email' | 'sms' | 'app') => {
    setFormData(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [type]: !prev.notificationPreferences[type]
      }
    }));
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      updateUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        notificationPreferences: formData.notificationPreferences
      });
      alert('Profile updated successfully!');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // This will prevent flash before redirect
  }

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
            <a href="/saved-properties">Saved Homes</a>
            <a href="/user/profile">My Account</a>
          </nav>
        </div>
      </header>

      <div className={styles.profileContainer}>
        <h1 className={styles.profileTitle}>My Account</h1>
        
        <div className={styles.profileSection}>
          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <h2>Account Information</h2>
            </div>
            <form onSubmit={handleUpdateProfile} className={styles.profileForm}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={styles.formInput}
                />
              </div>
              
              <button type="submit" className={styles.updateButton}>
                Update Profile
              </button>
            </form>
          </div>
          
          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <h2>Notification Preferences</h2>
            </div>
            <div className={styles.preferencesForm}>
              <div className={styles.preferenceToggle}>
                <label htmlFor="emailNotifications">Email Notifications</label>
                <div className={styles.toggleSwitch}>
                  <input 
                    type="checkbox" 
                    id="emailNotifications" 
                    checked={formData.notificationPreferences.email}
                    onChange={() => handleNotificationPreferenceChange('email')}
                  />
                  <span className={styles.slider}></span>
                </div>
              </div>
              
              <div className={styles.preferenceToggle}>
                <label htmlFor="smsNotifications">SMS Notifications</label>
                <div className={styles.toggleSwitch}>
                  <input 
                    type="checkbox" 
                    id="smsNotifications" 
                    checked={formData.notificationPreferences.sms}
                    onChange={() => handleNotificationPreferenceChange('sms')}
                  />
                  <span className={styles.slider}></span>
                </div>
              </div>
              
              <div className={styles.preferenceToggle}>
                <label htmlFor="appNotifications">App Notifications</label>
                <div className={styles.toggleSwitch}>
                  <input 
                    type="checkbox" 
                    id="appNotifications" 
                    checked={formData.notificationPreferences.app}
                    onChange={() => handleNotificationPreferenceChange('app')}
                  />
                  <span className={styles.slider}></span>
                </div>
              </div>
              
              <button 
                type="button" 
                className={styles.updateButton}
                onClick={handleUpdateProfile}
              >
                Save Preferences
              </button>
            </div>
          </div>
          
          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <h2>Activity Summary</h2>
            </div>
            <div className={styles.activitySummary}>
              <div className={styles.activityItem}>
                <span className={styles.activityIcon}>❤️</span>
                <div className={styles.activityDetails}>
                  <h3>Saved Properties</h3>
                  <p>{favoritesCount} properties saved</p>
                  <a href="/saved-properties" className={styles.activityLink}>
                    View Saved Properties
                  </a>
                </div>
              </div>
              
              <div className={styles.activityItem}>
                <span className={styles.activityIcon}>🔍</span>
                <div className={styles.activityDetails}>
                  <h3>Recent Searches</h3>
                  <a href="/recent-searches" className={styles.activityLink}>
                    View Search History
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <h2>Account Actions</h2>
            </div>
            <div className={styles.accountActions}>
              <button 
                className={`${styles.actionButton} ${styles.dangerButton}`}
                onClick={logout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default UserProfile;
                <input 
                  type="tel" 
                  id="phone" 
                  value={userData.phone}
                  onChange={(e) => setUserData({...userData, phone: e.target.value})}
                  className={styles.formInput}
                />
              </div>
              
              <button type="submit" className={styles.actionButtonPrimary}>
                Update Profile
              </button>
            </form>
          </div>

          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <h2>Your Activity</h2>
            </div>
            <div className={styles.activityStats}>
              <div className={styles.activityStat}>
                <span className={styles.statNumber}>{favoritesCount}</span>
                <span className={styles.statLabel}>Saved Properties</span>
                <button 
                  className={styles.viewButton}
                  onClick={() => router.push('/saved-properties')}
                >
                  View All
                </button>
              </div>
              <div className={styles.activityStat}>
                <span className={styles.statNumber}>0</span>
                <span className={styles.statLabel}>Recent Searches</span>
                <button 
                  className={styles.viewButton}
                  onClick={() => router.push('/recent-searches')}
                >
                  View All
                </button>
              </div>
            </div>
          </div>

          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <h2>Notification Preferences</h2>
            </div>
            <div className={styles.notificationPreferences}>
              <div className={styles.notificationOption}>
                <label htmlFor="emailNotif">Email Notifications</label>
                <input 
                  type="checkbox" 
                  id="emailNotif" 
                  checked={userData.notificationPreferences.email}
                  onChange={() => handleNotificationPreferenceChange('email')}
                />
              </div>
              <div className={styles.notificationOption}>
                <label htmlFor="smsNotif">SMS Notifications</label>
                <input 
                  type="checkbox" 
                  id="smsNotif" 
                  checked={userData.notificationPreferences.sms}
                  onChange={() => handleNotificationPreferenceChange('sms')}
                />
              </div>
              <div className={styles.notificationOption}>
                <label htmlFor="appNotif">App Notifications</label>
                <input 
                  type="checkbox" 
                  id="appNotif" 
                  checked={userData.notificationPreferences.app}
                  onChange={() => handleNotificationPreferenceChange('app')}
                />
              </div>
            </div>
            <button 
              className={styles.actionButtonSecondary}
              onClick={() => alert('Notification preferences saved!')}
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3>About Us</h3>
            <p>Ubika is a leading real estate marketplace dedicated to empowering consumers with data.</p>
          </div>
          <div className={styles.footerSection}>
            <h3>Contact</h3>
            <p>Email: info@ubika.com</p>
            <p>Phone: (123) 456-7890</p>
          </div>
          <div className={styles.footerSection}>
            <h3>Follow Us</h3>
            <div className={styles.socialIcons}>
              <a href="#" aria-label="Facebook">FB</a>
              <a href="#" aria-label="Twitter">TW</a>
              <a href="#" aria-label="Instagram">IG</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} Ubika. All rights reserved.</p>
        </div>
      </footer>

      {/* Mobile Navigation */}
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default UserProfile;
