import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'learner';
  organization_id: string;
  points: number;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vantage_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vantage_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!localStorage.getItem('vantage_token')) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data);
      localStorage.setItem('vantage_user', JSON.stringify(res.data));
    } catch (err) {
      console.error('Auth verification failed', err);
      setUser(null);
      setToken(null);
      localStorage.removeItem('vantage_token');
      localStorage.removeItem('vantage_user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { user: userData, access_token } = res.data;
    setUser(userData);
    setToken(access_token);
    localStorage.setItem('vantage_token', access_token);
    localStorage.setItem('vantage_user', JSON.stringify(userData));
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    const res = await api.post('/api/auth/register', { name, email, password, role });
    const { user: userData, access_token } = res.data;
    setUser(userData);
    setToken(access_token);
    localStorage.setItem('vantage_token', access_token);
    localStorage.setItem('vantage_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vantage_token');
    localStorage.removeItem('vantage_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
