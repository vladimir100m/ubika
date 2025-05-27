import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    app: boolean;
  };
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for demonstration purposes
const MOCK_USERS = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123', // In a real app, passwords would be hashed
    phone: '555-123-4567',
    notificationPreferences: {
      email: true,
      sms: false,
      app: true
    },
    profileImage: 'https://i.pravatar.cc/150?img=1'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'password456',
    phone: '555-987-6543',
    notificationPreferences: {
      email: true,
      sms: true,
      app: true
    },
    profileImage: 'https://i.pravatar.cc/150?img=2'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in (from localStorage in this example)
    const checkAuth = () => {
      setLoading(true);
      try {
        const storedUser = localStorage.getItem('ubikaUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        setError('Authentication error');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user with matching credentials
      const foundUser = MOCK_USERS.find(
        user => user.email === email && user.password === password
      );
      
      if (!foundUser) {
        throw new Error('Invalid email or password');
      }
      
      // Remove password before storing user
      const { password: _, ...userWithoutPassword } = foundUser;
      
      // Store user in state and localStorage
      setUser(userWithoutPassword);
      
      if (rememberMe) {
        // If "remember me" is checked, store in localStorage
        localStorage.setItem('ubikaUser', JSON.stringify(userWithoutPassword));
      } else {
        // Otherwise, use sessionStorage (cleared when browser is closed)
        sessionStorage.setItem('ubikaUser', JSON.stringify(userWithoutPassword));
        localStorage.removeItem('ubikaUser');
      }
      
      // Redirect to home page
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate password strength
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      // Check for at least one number and one letter (simple validation)
      if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
        throw new Error('Password must contain at least one letter and one number');
      }
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user with this email already exists
      const existingUser = MOCK_USERS.find(user => user.email === email);
      if (existingUser) {
        throw new Error('Email already in use');
      }
      
      // Create new user
      const newUser: User = {
        id: `${MOCK_USERS.length + 1}`,
        name,
        email,
        phone: '',
        notificationPreferences: {
          email: true,
          sms: false,
          app: true
        }
      };
      
      // In a real app, we would send this to an API
      // For now, just store in state and localStorage
      setUser(newUser);
      localStorage.setItem('ubikaUser', JSON.stringify(newUser));
      
      // Redirect to home page
      router.push('/');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ubikaUser');
    router.push('/');
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('ubikaUser', JSON.stringify(updatedUser));
  };

  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, we would call our API endpoint
      // const response = await fetch('/api/auth/forgot-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // });
      // const data = await response.json();
      // if (!data.success) throw new Error(data.message);
      
      // For this mock version, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if the email exists in our mock users
      const userExists = MOCK_USERS.some(user => user.email === email);
      
      if (!userExists) {
        // Don't reveal whether the email exists or not for security reasons
        // Just show a generic success message (handled by the component)
        console.log('User not found, but not revealing this for security');
      } else {
        console.log('Password reset requested for:', email);
        // In a real app, we would generate a token and send an email with a reset link
      }
      
      // Always return success for security (don't reveal if email exists)
      return;
    } catch (err) {
      console.error('Password reset request error:', err);
      setError('Failed to process your request. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, we would call our API endpoint
      // const response = await fetch('/api/auth/reset-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token, newPassword })
      // });
      // const data = await response.json();
      // if (!data.success) throw new Error(data.message);
      
      // For this mock version, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Password reset with token:', token);
      console.log('New password set (would be hashed in a real app)');
      
      // Simulating success
      return;
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to reset password. The link may be invalid or expired.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      logout, 
      updateUser,
      requestPasswordReset,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
