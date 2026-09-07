'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();

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
      const authenticatedUser = authenticateUser(credentials);
      if (!authenticatedUser) {
        return {
          success: false,
          error: 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!',
        };
      }

      setUser(authenticatedUser);
      saveAuthSession(authenticatedUser, credentials.rememberMe);

      return { success: true };
    } catch (err: any) {
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
