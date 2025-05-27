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
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
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

  const login = async (email: string, password: string) => {
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
      localStorage.setItem('ubikaUser', JSON.stringify(userWithoutPassword));
      
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

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, updateUser }}>
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
