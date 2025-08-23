import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { StandardLayout } from '../components';
import styles from '../styles/Home.module.css';
import { Property, PropertyFormData } from '../types';
import { FilterOptions } from '../components/MapFilters';

interface PropertyType {
  id: number;
  name: string;
  display_name: string;
}

interface PropertyStatus {
  id: number;
  name: string;
  display_name: string;
  color: string;
}

function Profile() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const u = user as (typeof user & { picture?: string | null; image?: string | null; sub?: string; email_verified?: boolean; updated_at?: string | number | Date });
  const isLoading = status === 'loading';
  const [sellerProperties, setSellerProperties] = useState<Property[]>([]);

  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    price: '',
    address: '',
    city: '',
    state: '',
    country: '',
    type: '',
    rooms: 0,
    bathrooms: 0,
    squareMeters: 0,
    status: 'available',
    seller_id: ''
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [propertyStatuses, setPropertyStatuses] = useState<PropertyStatus[]>([]);
  const router = useRouter();

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

  // Missing states for saved properties and UI tabs
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [activeTab, setActiveTab] = useState<'account' | 'saved' | 'sell'>('sell');

  useEffect(() => {
    if (!isLoading && !user) {
      // Don't redirect immediately, let them see the login prompts
      return;
    }
    
    if (user) {
      // Set seller_id in form data
  setFormData(prev => ({ ...prev, seller_id: u?.sub || '' }));
      
      // Load seller properties
      loadSellerProperties();
    }
  }, [user, isLoading]);

  // Fetch property types and statuses
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [typesResponse, statusesResponse] = await Promise.all([
          fetch('/api/property-types'),
          fetch('/api/property-statuses')
        ]);

        if (typesResponse.ok) {
          const types = await typesResponse.json();
          setPropertyTypes(types);
        }

        if (statusesResponse.ok) {
          const statuses = await statusesResponse.json();
          setPropertyStatuses(statuses);
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
      }
    };

    fetchFormData();
  }, []);

  const loadSellerProperties = async () => {
    if (!u?.sub) return;
    
    try {
      const response = await fetch(`/api/properties/seller?seller_id=${u.sub}`);
      if (response.ok) {
        const data = await response.json();
        setSellerProperties(data);
      }
    } catch (error) {
      console.error('Error loading seller properties:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  if (!u?.sub) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/properties/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
  body: JSON.stringify({ ...formData, seller_id: u.sub }),
      });

      if (response.ok) {
        setMessage({ text: 'Property created successfully!', type: 'success' });
        setFormData({
          title: '',
          description: '',
          price: '',
          address: '',
          city: '',
          state: '',
          country: '',
          type: '',
          rooms: 0,
          bathrooms: 0,
          squareMeters: 0,
          status: 'available',
          seller_id: u.sub
        });
        loadSellerProperties();
      } else {
        const errorData = await response.json();
        setMessage({ text: errorData.error || 'Failed to create property', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error creating property', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProperty = async (id: number) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const response = await fetch('/api/properties/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
  body: JSON.stringify({ id, seller_id: u?.sub }),
      });

      if (response.ok) {
        setMessage({ text: 'Property deleted successfully!', type: 'success' });
        loadSellerProperties();
      } else {
        const errorData = await response.json();
        setMessage({ text: errorData.error || 'Failed to delete property', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error deleting property', type: 'error' });
    }
  };

  if (isLoading) return <div>Loading...</div>;
  // Note: useSession doesn't return an `error`; manage via status and user.

  return (
    <StandardLayout 
      title="Profile" 
      subtitle="Manage your properties and account"
      showMapFilters={true}
      onFilterChange={handleFilterChange}
      onSearchLocationChange={handleSearchLocationChange}
      searchLocation=""
      initialFilters={{}}
    >
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .modern-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .modern-card:hover {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
        }
        
        .property-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }
        
        @media (max-width: 768px) {
          .property-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>
      
      {/* Profile Header - Focused on Selling */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#0073e6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white'
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: '600', 
                margin: '0',
                color: '#2d3748'
              }}>
                Sell Your Property
              </h1>
              <p style={{ 
                margin: '4px 0 0 0', 
                color: '#718096',
                fontSize: '16px'
              }}>
                List your properties and manage your listings
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className={styles.main}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          {!user ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
                Sign in to access your profile
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                Save properties, manage your listings, and more.
              </p>
              <a
                href="/api/auth/login"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#0073e6',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                Sign In
              </a>
            </div>
          ) : (
            <div>
              {/* Modern Tab Navigation */}
              <div style={{ 
                display: 'flex', 
                gap: '2px', 
                marginBottom: '32px',
                backgroundColor: '#f1f5f9',
                borderRadius: '12px',
                padding: '4px'
              }}>
                <button
                  onClick={() => setActiveTab('account')}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    border: 'none',
                    backgroundColor: activeTab === 'account' ? 'white' : 'transparent',
                    borderRadius: '8px',
                    color: activeTab === 'account' ? '#0073e6' : '#64748b',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '16px',
                    boxShadow: activeTab === 'account' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Account Settings
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    border: 'none',
                    backgroundColor: activeTab === 'saved' ? 'white' : 'transparent',
                    borderRadius: '8px',
                    color: activeTab === 'saved' ? '#0073e6' : '#64748b',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '16px',
                    boxShadow: activeTab === 'saved' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Saved Properties ({favorites.length})
                </button>
                <button
                  onClick={() => setActiveTab('sell')}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    border: 'none',
                    backgroundColor: activeTab === 'sell' ? 'white' : 'transparent',
                    borderRadius: '8px',
                    color: activeTab === 'sell' ? '#0073e6' : '#64748b',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '16px',
                    boxShadow: activeTab === 'sell' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  My Listings ({sellerProperties.length})
                </button>
              </div>

            {/* Tab Content */}
            {user && activeTab === 'account' && (
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
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Name:</span>
                        <span>{user.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Email:</span>
                        <span>{user.email}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Email Verified:</span>
                        <span>{u?.email_verified ? 'Yes' : 'No'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Member Since:</span>
                        <span>{u?.updated_at ? new Date(u.updated_at).toLocaleDateString() : '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Saved Properties:</span>
                        <span>{favorites.length}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Listed Properties:</span>
                        <span>{sellerProperties.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e9e9e9' }}>
                    <button 
                      onClick={() => window.location.href = '/api/auth/logout'}
                      style={{ 
                        backgroundColor: '#dc3545', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        padding: '12px 24px', 
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}              {activeTab === 'saved' && (
                <div>
                  {!user ? (
                    // Show login prompt for unauthenticated users
                    <div style={{ 
                      backgroundColor: 'white', 
                      borderRadius: '8px', 
                      padding: '48px',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>
                      <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>
                        Sign In to Save Properties
                      </h3>
                      <p style={{ color: '#666', fontSize: '16px', marginBottom: '32px' }}>
                        Create an account or sign in to save your favorite properties and access them anytime.
                      </p>
                      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                        <button
                          onClick={() => router.push('/api/auth/login')}
                          style={{
                            backgroundColor: '#1277e1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '12px 24px',
                            fontWeight: '600',
                            fontSize: '16px',
                            cursor: 'pointer'
                          }}
                        >
                          Sign In
                        </button>
                        <button
                          onClick={() => router.push('/api/auth/login')}
                          style={{
                            backgroundColor: 'white',
                            color: '#1277e1',
                            border: '2px solid #1277e1',
                            borderRadius: '4px',
                            padding: '12px 24px',
                            fontWeight: '600',
                            fontSize: '16px',
                            cursor: 'pointer'
                          }}
                        >
                          Create Account
                        </button>
                      </div>
                    </div>
                  ) : savedProperties.length === 0 ? (
                    <div style={{ 
                      backgroundColor: 'white', 
                      borderRadius: '8px', 
                      padding: '48px',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#666' }}>
                        No Saved Properties
                      </h3>
                      <p style={{ color: '#999', fontSize: '16px' }}>
                        Start browsing properties and save your favorites to see them here.
                      </p>
                      <button
                        onClick={() => router.push('/')}
                        style={{
                          marginTop: '24px',
                          backgroundColor: '#1277e1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '12px 24px',
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Browse Properties
                      </button>
                    </div>
                  ) : (
                    <div className="property-grid">
                      {savedProperties.map((property) => (
                        <div key={property.id} className="modern-card">
                          <div style={{ 
                            padding: '20px', 
                            border: '1px solid #ddd', 
                            borderRadius: '8px',
                            backgroundColor: '#fff'
                          }}>
                            <h3>{property.description}</h3>
                            <p>Price: {property.price}</p>
                            <p>{property.address}</p>
                            <p>Rooms: {property.rooms}</p>
                            <p>Bathrooms: {property.bathrooms}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sell' && (
                <div>
                  {!user ? (
                    // Show login prompt for unauthenticated users
                    <div style={{ 
                      backgroundColor: 'white', 
                      borderRadius: '8px', 
                      padding: '48px',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>
                      <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>
                        Sign In to Sell Properties
                      </h3>
                      <p style={{ color: '#666', fontSize: '16px', marginBottom: '32px' }}>
                        Create an account or sign in to start listing your properties and reach potential buyers.
                      </p>
                      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                        <button
                          onClick={() => router.push('/api/auth/login')}
                          style={{
                            backgroundColor: '#1277e1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '12px 24px',
                            fontWeight: '600',
                            fontSize: '16px',
                            cursor: 'pointer'
                          }}
                        >
                          Sign In
                        </button>
                        <button
                          onClick={() => router.push('/api/auth/login')}
                          style={{
                            backgroundColor: 'white',
                            color: '#1277e1',
                            border: '2px solid #1277e1',
                            borderRadius: '4px',
                            padding: '12px 24px',
                            fontWeight: '600',
                            fontSize: '16px',
                            cursor: 'pointer'
                          }}
                        >
                          Create Account
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Show property management for authenticated users
                    <>
                      {/* Add Property Form */}
                      <div style={{ 
                        backgroundColor: 'white', 
                        borderRadius: '8px', 
                        padding: '32px',
                        marginBottom: '32px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
                          List New Property
                        </h3>
                        
                        {message && (
                          <div style={{
                            padding: '12px 16px',
                            borderRadius: '4px',
                            marginBottom: '24px',
                            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                            color: message.type === 'success' ? '#155724' : '#721c24',
                            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                          }}>
                            {message.text}
                          </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <input
                              type="text"
                              placeholder="Property Title"
                              value={formData.title}
                              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                              required
                              style={{
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                backgroundColor: '#f9fafb',
                                transition: 'all 0.2s ease'
                              }}
                              onFocus={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.borderColor = '#0073e6';
                                e.target.style.boxShadow = '0 0 0 3px rgba(0, 115, 230, 0.1)';
                              }}
                              onBlur={(e) => {
                                e.target.style.backgroundColor = '#f9fafb';
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.boxShadow = 'none';
                              }}
                            />
                            <select
                              value={formData.type}
                              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                              required
                              style={{
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                backgroundColor: '#f9fafb',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onFocus={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.borderColor = '#0073e6';
                                e.target.style.boxShadow = '0 0 0 3px rgba(0, 115, 230, 0.1)';
                              }}
                              onBlur={(e) => {
                                e.target.style.backgroundColor = '#f9fafb';
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.boxShadow = 'none';
                              }}
                            >
                              <option value="">Select Property Type</option>
                              {propertyTypes.map((type) => (
                                <option key={type.id} value={type.name}>
                                  {type.display_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <textarea
                            placeholder="Property Description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            required
                            rows={4}
                            style={{
                              padding: '12px 16px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '16px',
                              backgroundColor: '#f9fafb',
                              resize: 'vertical',
                              transition: 'all 0.2s ease',
                              fontFamily: 'inherit'
                            }}
                            onFocus={(e) => {
                              e.target.style.backgroundColor = 'white';
                              e.target.style.borderColor = '#0073e6';
                              e.target.style.boxShadow = '0 0 0 3px rgba(0, 115, 230, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.target.style.backgroundColor = '#f9fafb';
                              e.target.style.borderColor = '#d1d5db';
                              e.target.style.boxShadow = 'none';
                            }}
                          />

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            <input
                              type="text"
                              placeholder="Price (e.g., $450,000)"
                              value={formData.price}
                              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                              required
                              style={{
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                backgroundColor: '#f9fafb',
                                transition: 'all 0.2s ease'
                              }}
                              onFocus={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.borderColor = '#0073e6';
                                e.target.style.boxShadow = '0 0 0 3px rgba(0, 115, 230, 0.1)';
                              }}
                              onBlur={(e) => {
                                e.target.style.backgroundColor = '#f9fafb';
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.boxShadow = 'none';
                              }}
                            />
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input
                                type="number"
                                placeholder="Bedrooms (e.g., 3)"
                                value={formData.rooms}
                                onChange={(e) => setFormData(prev => ({ ...prev, rooms: parseInt(e.target.value) || 0 }))}
                                required
                                min="0"
                                max="20"
                                step="1"
                                style={{
                                  padding: '12px 50px 12px 16px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '8px',
                                  fontSize: '16px',
                                  backgroundColor: '#f9fafb',
                                  transition: 'all 0.2s ease',
                                  width: '100%'
                                }}
                                onFocus={(e) => {
                                  e.target.style.backgroundColor = 'white';
                                  e.target.style.borderColor = '#0073e6';
                                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 115, 230, 0.1)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.backgroundColor = '#f9fafb';
                                  e.target.style.borderColor = '#d1d5db';
                                  e.target.style.boxShadow = 'none';
                                }}
                              />
                              <div style={{
                                position: 'absolute',
                                right: '2px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                display: 'flex',
                                flexDirection: 'column',
                                background: '#fff',
                                borderRadius: '2px',
                                borderLeft: '1px solid #d1d5db'
                              }}>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const newValue = Math.min((formData.rooms || 0) + 1, 20);
                                    setFormData(prev => ({ ...prev, rooms: newValue }));
                                  }}
                                  style={{
                                    width: '40px',
                                    height: '18px',
                                    border: 'none',
                                    background: '#f8f9fa',
                                    color: '#495057',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderBottom: '1px solid #d1d5db',
                                    borderRadius: '2px 2px 0 0'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#e9ecef';
                                    e.currentTarget.style.color = '#0073e6';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#f8f9fa';
                                    e.currentTarget.style.color = '#495057';
                                  }}
                                >
                                  ▲
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const newValue = Math.max((formData.rooms || 0) - 1, 0);
                                    setFormData(prev => ({ ...prev, rooms: newValue }));
                                  }}
                                  style={{
                                    width: '40px',
                                    height: '18px',
                                    border: 'none',
                                    background: '#f8f9fa',
                                    color: '#495057',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '0 0 2px 2px'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#e9ecef';
                                    e.currentTarget.style.color = '#0073e6';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#f8f9fa';
                                    e.currentTarget.style.color = '#495057';
                                  }}
                                >
                                  ▼
                                </button>
                              </div>
                            </div>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input
                                type="number"
                                placeholder="Bathrooms (e.g., 2)"
                                value={formData.bathrooms}
                                onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 0 }))}
                                required
                                min="0"
                                max="10"
                                step="1"
                                style={{
                                  padding: '12px 50px 12px 16px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '8px',
                                  fontSize: '16px',
                                  backgroundColor: '#f9fafb',
                                  transition: 'all 0.2s ease',
                                  width: '100%'
                                }}
                                onFocus={(e) => {
                                  e.target.style.backgroundColor = 'white';
                                  e.target.style.borderColor = '#0073e6';
                                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 115, 230, 0.1)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.backgroundColor = '#f9fafb';
                                  e.target.style.borderColor = '#d1d5db';
                                  e.target.style.boxShadow = 'none';
                                }}
                              />
                              <div style={{
                                position: 'absolute',
                                right: '2px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                display: 'flex',
                                flexDirection: 'column',
                                background: '#fff',
                                borderRadius: '2px',
                                borderLeft: '1px solid #d1d5db'
                              }}>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const newValue = Math.min((formData.bathrooms || 0) + 1, 10);
                                    setFormData(prev => ({ ...prev, bathrooms: newValue }));
                                  }}
                                  style={{
                                    width: '40px',
                                    height: '18px',
                                    border: 'none',
                                    background: '#f8f9fa',
                                    color: '#495057',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderBottom: '1px solid #d1d5db',
                                    borderRadius: '2px 2px 0 0'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#e9ecef';
                                    e.currentTarget.style.color = '#0073e6';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#f8f9fa';
                                    e.currentTarget.style.color = '#495057';
                                  }}
                                >
                                  ▲
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const newValue = Math.max((formData.bathrooms || 0) - 1, 0);
                                    setFormData(prev => ({ ...prev, bathrooms: newValue }));
                                  }}
                                  style={{
                                    width: '40px',
                                    height: '18px',
                                    border: 'none',
                                    background: '#f8f9fa',
                                    color: '#495057',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '0 0 2px 2px'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#e9ecef';
                                    e.currentTarget.style.color = '#0073e6';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#f8f9fa';
                                    e.currentTarget.style.color = '#495057';
                                  }}
                                >
                                  ▼
                                </button>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
                            <input
                              type="text"
                              placeholder="Street Address"
                              value={formData.address}
                              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                              required
                              style={{
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                backgroundColor: '#f9fafb',
                                transition: 'all 0.2s ease'
                              }}
                              onFocus={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.borderColor = '#0073e6';
                                e.target.style.boxShadow = '0 0 0 3px rgba(0, 115, 230, 0.1)';
                              }}
                              onBlur={(e) => {
                                e.target.style.backgroundColor = '#f9fafb';
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.boxShadow = 'none';
                              }}
                            />
                            <input
                              type="text"
                              placeholder="City"
                              value={formData.city}
                              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                              required
                              style={{
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                backgroundColor: '#f9fafb',
                                transition: 'all 0.2s ease'
                              }}
                              onFocus={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.borderColor = '#0073e6';
                                e.target.style.boxShadow = '0 0 0 3px rgba(0, 115, 230, 0.1)';
                              }}
                              onBlur={(e) => {
                                e.target.style.backgroundColor = '#f9fafb';
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.boxShadow = 'none';
                              }}
                            />
                            <input
                              type="text"
                              placeholder="State"
                              value={formData.state}
                              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                              required
                              style={{
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                backgroundColor: '#f9fafb',
                                transition: 'all 0.2s ease'
                              }}
                              onFocus={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.borderColor = '#0073e6';
                                e.target.style.boxShadow = '0 0 0 3px rgba(0, 115, 230, 0.1)';
                              }}
                              onBlur={(e) => {
                                e.target.style.backgroundColor = '#f9fafb';
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.boxShadow = 'none';
                              }}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            <input
                              type="text"
                              placeholder="Country"
                              value={formData.country}
                              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                              required
                              style={{
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                backgroundColor: '#f9fafb',
                                transition: 'all 0.2s ease'
                              }}
                              onFocus={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.borderColor = '#0073e6';
                                e.target.style.boxShadow = '0 0 0 3px rgba(0, 115, 230, 0.1)';
                              }}
                              onBlur={(e) => {
                                e.target.style.backgroundColor = '#f9fafb';
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.boxShadow = 'none';
                              }}
                            />
                            <input
                              type="number"
                              placeholder="Square Meters"
                              value={formData.squareMeters}
                              onChange={(e) => setFormData(prev => ({ ...prev, squareMeters: parseInt(e.target.value) || 0 }))}
                              required
                              min="0"
                              style={{
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                backgroundColor: '#f9fafb',
                                transition: 'all 0.2s ease'
                              }}
                              onFocus={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.borderColor = '#0073e6';
                                e.target.style.boxShadow = '0 0 0 3px rgba(0, 115, 230, 0.1)';
                              }}
                              onBlur={(e) => {
                                e.target.style.backgroundColor = '#f9fafb';
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.boxShadow = 'none';
                              }}
                            />
                            <select
                              value={formData.status}
                              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                              required
                              style={{
                                padding: '12px 16px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '16px',
                                backgroundColor: '#f9fafb',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onFocus={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.borderColor = '#0073e6';
                                e.target.style.boxShadow = '0 0 0 3px rgba(0, 115, 230, 0.1)';
                              }}
                              onBlur={(e) => {
                                e.target.style.backgroundColor = '#f9fafb';
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.boxShadow = 'none';
                              }}
                            >
                              <option value="">Select Status</option>
                              {propertyStatuses.map((status) => (
                                <option key={status.id} value={status.name}>
                                  {status.display_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="submit"
                            disabled={submitting}
                            style={{
                              backgroundColor: submitting ? '#9ca3af' : '#0073e6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '16px 32px',
                              fontWeight: '600',
                              fontSize: '16px',
                              cursor: submitting ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: submitting ? 'none' : '0 2px 4px rgba(0, 115, 230, 0.2)',
                              transform: submitting ? 'none' : 'translateY(0)',
                              width: '100%',
                              marginTop: '8px'
                            }}
                            onMouseEnter={(e) => {
                              if (!submitting) {
                                e.currentTarget.style.backgroundColor = '#005bb5';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 115, 230, 0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!submitting) {
                                e.currentTarget.style.backgroundColor = '#0073e6';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 115, 230, 0.2)';
                              }
                            }}
                          >
                            {submitting ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '16px',
                                  height: '16px',
                                  border: '2px solid #ffffff',
                                  borderTop: '2px solid transparent',
                                  borderRadius: '50%',
                                  animation: 'spin 1s linear infinite'
                                }}></div>
                                Creating Property...
                              </div>
                            ) : (
                              'List Property'
                            )}
                          </button>
                        </form>
                      </div>

                      {/* Listed Properties */}
                      <div style={{ 
                        backgroundColor: 'white', 
                        borderRadius: '8px', 
                        padding: '32px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
                          My Listed Properties
                        </h3>
                        
                        {sellerProperties.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <p style={{ color: '#666', fontSize: '16px' }}>
                              You haven't listed any properties yet. Use the form above to add your first property.
                            </p>
                          </div>
                        ) : (
                          <div className="property-grid">
                            {sellerProperties.map((property) => (
                              <div key={property.id} style={{ position: 'relative' }} className="modern-card">
                                <div style={{ 
                                  padding: '20px', 
                                  border: '1px solid #ddd', 
                                  borderRadius: '8px',
                                  backgroundColor: '#fff'
                                }}>
                                  <h3>{property.description}</h3>
                                  <p>Price: {property.price}</p>
                                  <p>{property.address}</p>
                                  <p>Rooms: {property.rooms}</p>
                                  <p>Bathrooms: {property.bathrooms}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteProperty(property.id)}
                                  style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#b91c1c';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#dc2626';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            )}
        </div>
      </main>
    </StandardLayout>
  );
}

// This will redirect to login if the user is not authenticated
export default Profile;
