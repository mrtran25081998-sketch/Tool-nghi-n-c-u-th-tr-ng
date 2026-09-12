'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AuthUser,
  LoginCredentials,
  authenticateUser,
  saveAuthSession,
  getStoredAuthSession,
  clearAuthSession,
} from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check initial auth state from session/cookie
    const existing = getStoredAuthSession();
    if (existing) {
      setUser(existing);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Try API login first (validates against DB and dynamically added users)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success && resData.data) {
        const authenticatedUser = resData.data as AuthUser;
        setUser(authenticatedUser);
        saveAuthSession(authenticatedUser, credentials.rememberMe);
        return { success: true };
      }

      // 2. Fallback to client-side mock accounts if API call fails
      const fallbackUser = authenticateUser(credentials);
      if (fallbackUser) {
        setUser(fallbackUser);
        saveAuthSession(fallbackUser, credentials.rememberMe);
        return { success: true };
      }

      return {
        success: false,
        error: resData.error || 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!',
      };
    } catch (err: any) {
      // Fallback
      const fallbackUser = authenticateUser(credentials);
      if (fallbackUser) {
        setUser(fallbackUser);
        saveAuthSession(fallbackUser, credentials.rememberMe);
        return { success: true };
      }

      return {
        success: false,
        error: err?.message || 'Có lỗi xảy ra trong quá trình đăng nhập.',
      };
    }
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
