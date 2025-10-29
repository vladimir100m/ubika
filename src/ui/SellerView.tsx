'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Property } from '../types';
import PropertyCardGrid from './PropertyCardGrid';
import PropertyPopup from './PropertyPopup';
import AddPropertyPopup from './AddPropertyPopup';
import Header from './Header';
import Footer from './Footer';
import styles from '../styles/Seller.module.css';

interface SellerViewProps {
  initialProperties?: Property[];
}

const SellerView: React.FC<SellerViewProps> = ({ initialProperties = [] }) => {
  const router = useRouter();
  const popupMapRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [isLoading, setIsLoading] = useState(!initialProperties.length);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Fetch seller properties if not provided initially
  useEffect(() => {
    if (!initialProperties.length && (session?.user as any)?.sub) {
      fetchSellerProperties();
    }
  }, [session, initialProperties.length]);

  const fetchSellerProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const sellerId = (session?.user as any)?.sub;
      console.log('🔍 Fetching properties for seller_id:', sellerId);
      
      // Add cache buster to force fresh data
      const cacheBuster = `_t=${Date.now()}`;
      const response = await fetch(`/api/properties?seller=${sellerId}&${cacheBuster}`);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      
      const data = await response.json();
      console.log('📦 API Response:', data);
      console.log('📦 Data length:', Array.isArray(data) ? data.length : (data.properties || []).length);
      
      setProperties(Array.isArray(data) ? data : data.properties || []);
    } catch (err) {
      console.error('Error fetching seller properties:', err);
      setError(err instanceof Error ? err.message : 'Failed to load properties');
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
  };

  const handleClosePropertyDetail = () => {
    setSelectedProperty(null);
  };

  const handleAddProperty = () => {
    setEditingProperty(null);
    setIsAddPropertyOpen(true);
  };

  const handleAddPropertyClose = () => {
    setIsAddPropertyOpen(false);
    setEditingProperty(null);
  };

  const handlePropertyCreated = (propertyId: string) => {
    // Refresh the properties list
    fetchSellerProperties();
  };

  const handlePropertyUpdated = (propertyId: string) => {
    // Refresh the properties list
    fetchSellerProperties();
  };

  const handleDeleteProperty = async (propertyId: number | string) => {
    // Verify ownership - only allow deleting own properties
    const currentSellerId = (session?.user as any)?.sub;
    const propertyToDelete = properties.find(p => p.id === propertyId);
    
    if (!currentSellerId || !propertyToDelete || propertyToDelete.seller_id !== currentSellerId) {
      setError('You can only delete your own properties');
      return;
    }

    if (!confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete property');
      }

      // Remove from list
      setProperties(properties.filter(p => p.id !== propertyId));
    } catch (err) {
      console.error('Error deleting property:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete property');
    }
  };

  const handleEditPropertyClick = (property: Property) => {
    // Verify ownership - only allow editing own properties
    const currentSellerId = (session?.user as any)?.sub;
    
    if (!currentSellerId || property.seller_id !== currentSellerId) {
      setError('You can only edit your own properties');
      return;
    }
    
    setEditingProperty(property);
    setIsAddPropertyOpen(true);
  };

  // Calculate statistics
  const calculateAveragePrice = () => {
    if (properties.length === 0) return 0;
    const total = properties.reduce((sum, p) => sum + (parseFloat(p.price as any) || 0), 0);
    return Math.round(total / properties.length);
  };

  const calculateTotalValue = () => {
    return properties.reduce((sum, p) => sum + (parseFloat(p.price as any) || 0), 0);
  };

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.sellerViewContainer}>
      <Header />
      
      <main className={styles.sellerViewMain}>
        <div className={styles.sellerViewContent}>
          {/* Header Section */}
          <div className={styles.sellerViewHeader}>
            <div className={styles.titleSection}>
              <h1>🏪 Seller Dashboard</h1>
              <p className={styles.subtitle}>Manage and monitor your property listings</p>
            </div>
            
            <button 
              onClick={handleAddProperty}
              className={styles.addPropertyButton}
              aria-label="Add new property"
            >
              <span className={styles.buttonIcon}>➕</span>
              Add Property
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorBanner}>
              <span className={styles.errorIcon}>⚠️</span>
              <div className={styles.errorContent}>
                <strong>Error</strong>
                <p>{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className={styles.closeBanner}
                aria-label="Close error message"
              >
                ✕
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading your properties...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && properties.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🏠</div>
              <h2>No properties yet</h2>
              <p>Start selling by adding your first property</p>
              <button 
                onClick={handleAddProperty}
                className={styles.emptyStateButton}
              >
                Add Your First Property
              </button>
            </div>
          )}

          {/* Statistics Section */}
          {!isLoading && properties.length > 0 && (
            <div className={styles.statsSection}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📊</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Total Listings</div>
                  <div className={styles.statValue}>{properties.length}</div>
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon}>💰</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Average Price</div>
                  <div className={styles.statValue}>
                    ${calculateAveragePrice().toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>📈</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Total Value</div>
                  <div className={styles.statValue}>
                    ${calculateTotalValue().toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>🏘️</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Active Markets</div>
                  <div className={styles.statValue}>
                    {new Set(properties.map(p => p.city)).size}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Properties Grid */}
          {!isLoading && properties.length > 0 && (
            <div className={styles.propertiesSection}>
              <div className={styles.sectionHeader}>
                <h2>Your Properties ({properties.length})</h2>
                <p className={styles.sectionSubtitle}>
                  {properties.length} listing{properties.length !== 1 ? 's' : ''} active
                </p>
              </div>

              {/* Property Cards Grid - Reusing PropertyCardGrid component */}
              <div className={styles.propertyGridWrapper}>
                <PropertyCardGrid
                  properties={properties}
                  onPropertyClick={handlePropertyClick}
                  hideActions={false}
                  showEditDelete={true}
                  onEdit={handleEditPropertyClick}
                  onDelete={(property) => handleDeleteProperty(property.id)}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedProperty && (
        <PropertyPopup
          selectedProperty={selectedProperty}
          onClose={handleClosePropertyDetail}
        />
      )}

      <AddPropertyPopup
        isOpen={isAddPropertyOpen}
        onClose={handleAddPropertyClose}
        onPropertyCreated={handlePropertyCreated}
        editingProperty={editingProperty}
        onPropertyUpdated={handlePropertyUpdated}
      />

      <Footer />
    </div>
  );
};

export default SellerView;
