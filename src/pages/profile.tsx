import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import PropertyCard from '../components/PropertyCard';
import ImageUpload from '../components/ImageUpload';
import styles from '../styles/Home.module.css';
import { Property, PropertyFormData } from '../types';

function Profile() {
  const { user, error, isLoading } = useUser();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'account' | 'saved' | 'sell'>('saved');
  const [properties, setProperties] = useState<Property[]>([]);
  const [sellerProperties, setSellerProperties] = useState<Property[]>([]);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
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
  const router = useRouter();

  useEffect(() => {
    // Handle tab query parameter
    const { tab } = router.query;
    if (tab && ['account', 'saved', 'sell'].includes(tab as string)) {
      setActiveTab(tab as 'account' | 'saved' | 'sell');
    }
    
    if (!isLoading && !user) {
      // Don't redirect immediately, let them see the login prompts
      return;
    }
    
    if (user) {
      // Load user's favorites from localStorage
      const userFavorites = JSON.parse(localStorage.getItem(`favorites_${user.sub}`) || '[]');
      setFavorites(userFavorites);
      
      // Set seller_id in form data
      setFormData(prev => ({ ...prev, seller_id: user.sub || '' }));
      
      // Set default tab for authenticated users (only if no tab query param)
      if (!tab && activeTab === 'saved' && userFavorites.length === 0) {
        setActiveTab('account');
      }
      
      // Load all properties and seller properties
      loadProperties();
      loadSellerProperties();
    }
  }, [user, isLoading, router]);

  // Load saved properties when favorites change
  useEffect(() => {
    if (properties.length > 0 && favorites.length > 0) {
      const saved = properties.filter((property: Property) => favorites.includes(property.id));
      setSavedProperties(saved);
    } else {
      setSavedProperties([]);
    }
  }, [properties, favorites]);

  const loadProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const loadSellerProperties = async () => {
    if (!user?.sub) return;
    
    try {
      const response = await fetch(`/api/properties/seller?seller_id=${user.sub}`);
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
    if (!user?.sub) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/properties/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, seller_id: user.sub }),
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
          seller_id: user.sub
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
        body: JSON.stringify({ id, seller_id: user?.sub }),
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
  if (error) return <div>{error.message}</div>;  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '32px' }}>
            {user ? 'My Profile' : 'Profile'}
          </h1>
          
          <div>
            {/* Tab Navigation */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '32px',
              borderBottom: '1px solid #e9e9e9'
            }}>
              {user && (
                <button
                  onClick={() => setActiveTab('account')}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    borderBottom: activeTab === 'account' ? '2px solid #1277e1' : '2px solid transparent',
                    color: activeTab === 'account' ? '#1277e1' : '#666',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Account
                </button>
              )}
              <button
                onClick={() => {
                  if (!user) {
                    router.push('/api/auth/login');
                  } else {
                    setActiveTab('saved');
                  }
                }}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderBottom: activeTab === 'saved' ? '2px solid #1277e1' : '2px solid transparent',
                  color: activeTab === 'saved' ? '#1277e1' : '#666',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Saved Properties {user ? `(${favorites.length})` : ''}
              </button>
              <button
                onClick={() => {
                  if (!user) {
                    router.push('/api/auth/login');
                  } else {
                    setActiveTab('sell');
                  }
                }}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderBottom: activeTab === 'sell' ? '2px solid #1277e1' : '2px solid transparent',
                  color: activeTab === 'sell' ? '#1277e1' : '#666',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Sell Properties {user ? `(${sellerProperties.length})` : ''}
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
                    {user.picture && (
                      <img 
                        src={user.picture} 
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
                        <span>{user.email_verified ? 'Yes' : 'No'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Member Since:</span>
                        <span>{new Date(user.updated_at || '').toLocaleDateString()}</span>
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
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                      gap: '24px' 
                    }}>
                      {savedProperties.map((property) => (
                        <PropertyCard 
                          key={property.id}
                          image_url={property.image_url}
                          description={property.description}
                          price={property.price}
                          rooms={property.rooms}
                          bathrooms={property.bathrooms}
                          address={property.address}
                          squareMeters={property.squareMeters}
                          yearBuilt={property.yearBuilt}
                          latitude={property.latitude}
                          longitude={property.longitude}
                        />
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
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '16px'
                              }}
                            />
                            <input
                              type="text"
                              placeholder="Property Type (e.g., House, Apartment)"
                              value={formData.type}
                              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                              required
                              style={{
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '16px'
                              }}
                            />
                          </div>

                          <textarea
                            placeholder="Description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            required
                            rows={4}
                            style={{
                              padding: '12px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '16px',
                              resize: 'vertical'
                            }}
                          />

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            <input
                              type="text"
                              placeholder="Price"
                              value={formData.price}
                              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                              required
                              style={{
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '16px'
                              }}
                            />
                            <input
                              type="number"
                              placeholder="Rooms"
                              value={formData.rooms}
                              onChange={(e) => setFormData(prev => ({ ...prev, rooms: parseInt(e.target.value) || 0 }))}
                              required
                              style={{
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '16px'
                              }}
                            />
                            <input
                              type="number"
                              placeholder="Bathrooms"
                              value={formData.bathrooms}
                              onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 0 }))}
                              required
                              style={{
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '16px'
                              }}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            <input
                              type="text"
                              placeholder="Address"
                              value={formData.address}
                              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                              required
                              style={{
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '16px'
                              }}
                            />
                            <input
                              type="text"
                              placeholder="City"
                              value={formData.city}
                              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                              required
                              style={{
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '16px'
                              }}
                            />
                            <input
                              type="text"
                              placeholder="State"
                              value={formData.state}
                              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                              required
                              style={{
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '16px'
                              }}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <input
                              type="text"
                              placeholder="Country"
                              value={formData.country}
                              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                              required
                              style={{
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '16px'
                              }}
                            />
                            <input
                              type="number"
                              placeholder="Square Meters"
                              value={formData.squareMeters}
                              onChange={(e) => setFormData(prev => ({ ...prev, squareMeters: parseInt(e.target.value) || 0 }))}
                              required
                              style={{
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '16px'
                              }}
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={submitting}
                            style={{
                              backgroundColor: submitting ? '#ccc' : '#1277e1',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '16px 24px',
                              fontWeight: '600',
                              fontSize: '16px',
                              cursor: submitting ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {submitting ? 'Creating Property...' : 'Create Property'}
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
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                            gap: '24px' 
                          }}>
                            {sellerProperties.map((property) => (
                              <div key={property.id} style={{ position: 'relative' }}>
                                <PropertyCard 
                                  image_url={property.image_url}
                                  description={property.description}
                                  price={property.price}
                                  rooms={property.rooms}
                                  bathrooms={property.bathrooms}
                                  address={property.address}
                                  squareMeters={property.squareMeters}
                                  yearBuilt={property.yearBuilt}
                                  latitude={property.latitude}
                                  longitude={property.longitude}
                                />
                                <button
                                  onClick={() => handleDeleteProperty(property.id)}
                                  style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
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
        </div>
      </main>
    </div>
  );
}

// This will redirect to login if the user is not authenticated
export default Profile;
