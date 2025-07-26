import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface User {
  id: string;
  username: string;
  role: string;
  property: string | null;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  validateToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        } else {
          console.warn('No user data in response');
          localStorage.removeItem('token');
        }
      } else {
        console.warn('Token verification failed with status:', response.status);
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      // Input validation
      if (!username?.trim()) {
        throw new Error('Username is required');
      }
      if (!password?.trim()) {
        throw new Error('Password is required');
      }
      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      console.log('Attempting login for username:', username);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
        const errorMessage = response.status === 401 ? 'Invalid username or password' :
                           response.status === 429 ? 'Too many login attempts. Please try again later.' :
                           response.status >= 500 ? 'Server error. Please try again later.' :
                           errorData.error || 'Login failed';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const token = data.token;

      if (!token || typeof token !== 'string') {
        throw new Error('Invalid response from server');
      }

      console.log('Login successful, token received:', token.substring(0, 10) + '...');
      localStorage.setItem('token', token);

      // Verify the token immediately
      await verifyToken();
      console.log('Token verification complete');
    } catch (error) {
      console.error('Login error:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      throw new Error(message);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const validateToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const response = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        console.warn('Token verification failed with status:', response.status);
        logout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      logout();
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, validateToken }}>
      {children}
    </AuthContext.Provider>
  );
}