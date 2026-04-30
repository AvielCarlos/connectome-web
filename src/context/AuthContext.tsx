import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authStorage, AuraClient } from '../lib/AuraClient';

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  profile: any | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(authStorage.isAuthenticated());
  const [userId, setUserId] = useState<string | null>(authStorage.getUserId());
  const [profile, setProfile] = useState<any | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!authStorage.isAuthenticated()) return;
    try {
      const data = await AuraClient.getProfile();
      setProfile(data);
    } catch (e) {
      console.warn('Failed to load profile:', e);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshProfile();
    }
  }, [isAuthenticated, refreshProfile]);

  const login = async (email: string, password: string) => {
    const res = await AuraClient.login(email, password);
    authStorage.setAuth(res.access_token, res.user_id);
    setIsAuthenticated(true);
    setUserId(res.user_id);
  };

  const register = async (email: string, password: string, displayName?: string) => {
    const res = await AuraClient.register(email, password, displayName);
    authStorage.setAuth(res.access_token, res.user_id);
    setIsAuthenticated(true);
    setUserId(res.user_id);
  };

  const logout = () => {
    authStorage.clearAuth();
    setIsAuthenticated(false);
    setUserId(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, profile, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
