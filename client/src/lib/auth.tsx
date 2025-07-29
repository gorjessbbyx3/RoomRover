import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  username: string;
  role: string;
  property: string | null;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: () => boolean;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token refresh interval (15 minutes)
const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const currentToken = token || localStorage.getItem('token');
      if (!currentToken) return false;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        logout();
        return false;
      }

      const data = await response.json();
      setToken(data.token);
      localStorage.setItem('token', data.token);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  }, [logout, token]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login for username:', username);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        return false;
      }

      const data = await response.json();
      console.log('Login successful, token received:', data.token?.substring(0, 10) + '...');

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Set up automatic token refresh
      if (sessionTimeout) clearTimeout(sessionTimeout);
      const timeout = setTimeout(() => {
        refreshToken();
      }, TOKEN_REFRESH_INTERVAL);
      setSessionTimeout(timeout);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    }
  }, []);

  const verifyToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      } else {
        localStorage.removeItem('token');
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      return false;
    }
  }, []);

  const isAuthenticated = useCallback(() => {
    const token = localStorage.getItem('token');
    return !!(token && user);
  }, [user]);

  const contextValue: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};