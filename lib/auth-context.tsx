'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

interface User {
  id: string;
  email: string;
  firstName?: string;
  role: string;
  tenantId: string;
}

interface Tenant {
  id: string;
  businessName: string;
  gstin?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
}

interface RegisterData {
  businessName: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  gstin?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
    tenant: Tenant;
  };
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to save auth data to localStorage
const saveAuthToStorage = (userData: User, tenantData: Tenant, tokenData: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth', JSON.stringify({
      user: userData,
      tenant: tenantData,
      token: tokenData
    }));
  }
};

// Helper to load auth data from localStorage
const loadAuthFromStorage = (): { user: User; tenant: Tenant; token: string } | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('auth');
    if (stored) {
      return JSON.parse(stored) as { user: User; tenant: Tenant; token: string };
    }
  } catch (error) {
    localStorage.removeItem('auth');
  }
  return null;
};

// Helper to clear auth data from localStorage
const clearAuthFromStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth');
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Compute isAuthenticated
  const isAuthenticated = useMemo(() => !!user && !!token, [user, token]);

  // Refresh auth from localStorage - useful for syncing state
  const refreshAuth = useCallback(() => {
    const storedAuth = loadAuthFromStorage();
    if (storedAuth) {
      setUser(storedAuth.user);
      setTenant(storedAuth.tenant);
      setToken(storedAuth.token);
    }
  }, []);

  // Load from localStorage on mount (only client-side)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedAuth = loadAuthFromStorage();
    if (storedAuth) {
      setUser(storedAuth.user);
      setTenant(storedAuth.tenant);
      setToken(storedAuth.token);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      // Normalize email to lowercase for case-insensitive matching
      const normalizedEmail = email.toLowerCase().trim();

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password })
      });

      if (!res.ok) {
        const error = await res.json() as { error: string; details?: string };
        const errorMsg = error.details || error.error || 'Login failed';
        console.error('[v0] Login response error:', errorMsg);
        throw new Error(errorMsg);
      }

      const response = await res.json() as AuthResponse;
      const { user: userData, tenant: tenantData, token: tokenData } = response.data;

      // Save to localStorage FIRST, then update state
      // This ensures that if there's a page navigation, the data is persisted
      saveAuthToStorage(userData, tenantData, tokenData);

      // Then update React state
      setUser(userData);
      setTenant(tenantData);
      setToken(tokenData);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Login failed');
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<void> => {
    try {
      // Normalize email to lowercase
      const normalizedData = {
        ...data,
        email: data.email.toLowerCase().trim()
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedData)
      });

      if (!res.ok) {
        const error = await res.json() as { error: string; details?: string };
        const errorMsg = error.details || error.error || 'Registration failed';
        console.error('[v0] Register response error:', errorMsg);
        throw new Error(errorMsg);
      }

      const response = await res.json() as AuthResponse;
      const { user: userData, tenant: tenantData, token: tokenData } = response.data;

      // Save to localStorage FIRST, then update state
      saveAuthToStorage(userData, tenantData, tokenData);

      // Then update React state
      setUser(userData);
      setTenant(tenantData);
      setToken(tokenData);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Registration failed');
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthFromStorage();
    setUser(null);
    setTenant(null);
    setToken(null);
  }, []);

  const value = useMemo(() => ({
    user,
    tenant,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshAuth
  }), [user, tenant, token, isLoading, isAuthenticated, login, register, logout, refreshAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
