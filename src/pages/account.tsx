import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { StandardLayout } from '../ui';
import standardStyles from '../styles/StandardComponents.module.css';
import { FilterOptions } from '../ui/MapFilters';

export default function Account() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  // Filter handlers - redirect to map page with filters
  const handleFilterChange = (filters: FilterOptions) => {
    const query: any = {};
    if (filters.operation) query.operation = filters.operation;
    if (filters.priceMin) query.minPrice = filters.priceMin;
    if (filters.priceMax) query.maxPrice = filters.priceMax;
    if (filters.beds) query.bedrooms = filters.beds;
    if (filters.baths) query.bathrooms = filters.baths;
    if (filters.homeType) query.propertyType = filters.homeType;
    if (filters.moreFilters.minArea) query.minArea = filters.moreFilters.minArea;
    if (filters.moreFilters.maxArea) query.maxArea = filters.moreFilters.maxArea;
    
    router.push({
      pathname: '/map',
      query
    });
  };

  const handleSearchLocationChange = (location: string) => {
    const query: any = {};
    if (location && location.trim() !== '') {
      query.zone = location;
    }
    router.push({
      pathname: '/map',
      query
    });
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    setIsLoading(false);
  }, [session, status, router]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (isLoading) {
    return (
      <StandardLayout title="Loading..." subtitle="">
        <div className={standardStyles.loadingContainer}>
          <div className={standardStyles.loadingSpinner}></div>
          <p>Loading your account...</p>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout 
      title="Account Settings" 
      subtitle="Manage your profile and preferences"
      showMapFilters={true}
      onFilterChange={handleFilterChange}
      onSearchLocationChange={handleSearchLocationChange}
      searchLocation=""
      initialFilters={{}}
    >
      <div className={standardStyles.pageContainer}>
        {/* Navigation Tabs */}
        <div className={standardStyles.tabNavigation}>
          <button
            className={`${standardStyles.tabButton} ${activeTab === 'profile' ? standardStyles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`${standardStyles.tabButton} ${activeTab === 'preferences' ? standardStyles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
          <button
            className={`${standardStyles.tabButton} ${activeTab === 'security' ? standardStyles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className={standardStyles.tabContent}>
            <div className={standardStyles.card}>
              <h3 className={standardStyles.cardTitle}>Profile Information</h3>
              
              <div className={standardStyles.profileSection}>
                <div className={standardStyles.profileAvatar}>
                  <img 
                    src={session?.user?.image || '/default-avatar.png'} 
                    alt="Profile"
                    className={standardStyles.avatarImage}
                  />
                </div>
                
                <div className={standardStyles.profileInfo}>
                  <div className={standardStyles.formGroup}>
                    <label className={standardStyles.label}>Name</label>
                    <input 
                      type="text" 
                      className={standardStyles.input}
                      value={session?.user?.name || ''}
                      readOnly
                    />
                  </div>
                  
                  <div className={standardStyles.formGroup}>
                    <label className={standardStyles.label}>Email</label>
                    <input 
                      type="email" 
                      className={standardStyles.input}
                      value={session?.user?.email || ''}
                      readOnly
                    />
                  </div>
                  
                  <div className={standardStyles.formGroup}>
                    <label className={standardStyles.label}>Member Since</label>
                    <input 
                      type="text" 
                      className={standardStyles.input}
                      value={new Date().toLocaleDateString()}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className={standardStyles.tabContent}>
            <div className={standardStyles.card}>
              <h3 className={standardStyles.cardTitle}>Notification Preferences</h3>
              
              <div className={standardStyles.formGroup}>
                <label className={standardStyles.checkboxContainer}>
                  <input type="checkbox" className={standardStyles.checkbox} defaultChecked />
                  <span className={standardStyles.checkboxLabel}>Email notifications for new properties</span>
                </label>
              </div>
              
              <div className={standardStyles.formGroup}>
                <label className={standardStyles.checkboxContainer}>
                  <input type="checkbox" className={standardStyles.checkbox} defaultChecked />
                  <span className={standardStyles.checkboxLabel}>Price change alerts</span>
                </label>
              </div>
              
              <div className={standardStyles.formGroup}>
                <label className={standardStyles.checkboxContainer}>
                  <input type="checkbox" className={standardStyles.checkbox} />
                  <span className={standardStyles.checkboxLabel}>Weekly market reports</span>
                </label>
              </div>
            </div>

            <div className={standardStyles.card}>
              <h3 className={standardStyles.cardTitle}>Display Preferences</h3>
              
              <div className={standardStyles.formGroup}>
                <label className={standardStyles.label}>Currency</label>
                <select className={standardStyles.select}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              
              <div className={standardStyles.formGroup}>
                <label className={standardStyles.label}>Language</label>
                <select className={standardStyles.select}>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className={standardStyles.tabContent}>
            <div className={standardStyles.card}>
              <h3 className={standardStyles.cardTitle}>Account Security</h3>
              
              <div className={standardStyles.securitySection}>
                <div className={standardStyles.securityItem}>
                  <div className={standardStyles.securityInfo}>
                    <h4>Two-Factor Authentication</h4>
                    <p className={standardStyles.securityDescription}>
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <button className={standardStyles.buttonSecondary}>
                    Enable 2FA
                  </button>
                </div>
                
                <div className={standardStyles.securityItem}>
                  <div className={standardStyles.securityInfo}>
                    <h4>Login Activity</h4>
                    <p className={standardStyles.securityDescription}>
                      View recent login activity and manage active sessions
                    </p>
                  </div>
                  <button className={standardStyles.buttonSecondary}>
                    View Activity
                  </button>
                </div>
                
                <div className={standardStyles.securityItem}>
                  <div className={standardStyles.securityInfo}>
                    <h4>Data Export</h4>
                    <p className={standardStyles.securityDescription}>
                      Download a copy of your data
                    </p>
                  </div>
                  <button className={standardStyles.buttonSecondary}>
                    Export Data
                  </button>
                </div>
              </div>
            </div>

            <div className={standardStyles.card}>
              <h3 className={standardStyles.cardTitle}>Danger Zone</h3>
              
              <div className={standardStyles.dangerZone}>
                <div className={standardStyles.dangerItem}>
                  <div className={standardStyles.dangerInfo}>
                    <h4>Sign Out</h4>
                    <p className={standardStyles.dangerDescription}>
                      Sign out of your current session
                    </p>
                  </div>
                  <button 
                    className={standardStyles.buttonDanger}
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
                
                <div className={standardStyles.dangerItem}>
                  <div className={standardStyles.dangerInfo}>
                    <h4>Delete Account</h4>
                    <p className={standardStyles.dangerDescription}>
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <button className={standardStyles.buttonDanger}>
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StandardLayout>
  );
}
