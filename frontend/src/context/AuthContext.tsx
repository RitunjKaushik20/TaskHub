import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { authApi, type LoginPayload, type RegisterPayload } from '../api/auth';

export interface AuthResult {
  ok: boolean;
  message?: string;
  needsOtp?: boolean;
  pendingEmailVerification?: boolean;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthResult>;
  register: (payload: RegisterPayload) => Promise<AuthResult>;
  verifyEmail: (email: string, code: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  hydrateSession: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const storeToken = (token?: string) => {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('access_token', token);
    }
  };

  const hydrateSession = useCallback(async (): Promise<User | null> => {
    setIsLoading(true);
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        setUser(response.data);
        return response.data;
      } else {
        setUser(null);
        return null;
      }
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrateSession();

    const handleUnauthorized = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [hydrateSession]);

  const login = async (payload: LoginPayload): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(payload);
      if (response.success && response.data) {
        storeToken((response.data as any).token);
        setUser(response.data);
        return { ok: true };
      }
      // Part B: unverified accounts are told to verify before signing in.
      if (!response.success && response.errors?.email?.includes('EMAIL_NOT_VERIFIED')) {
        return {
          ok: false,
          needsOtp: true,
          email: payload.email,
          message: response.message || 'Please verify your email to continue.',
        };
      }
      return { ok: false, message: response.message || 'Authentication failed.' };
    } catch {
      return { ok: false, message: 'Authentication failed.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const response = await authApi.register(payload);
      if (response.success && response.data) {
        const data = response.data as any;
        if (data.token) {
          storeToken(data.token);
          setUser(response.data);
          return { ok: true };
        }
        if (data.pendingEmailVerification) {
          return {
            ok: true,
            pendingEmailVerification: true,
            email: data.email || payload.email,
          };
        }
        setUser(response.data);
        return { ok: true };
      }
      return {
        ok: false,
        message: response.message || 'Unable to create account. Please try again.',
      };
    } catch {
      return { ok: false, message: 'Unable to create account. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (email: string, code: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const response = await authApi.verifyOtp({ email, code });
      if (response.success && response.data) {
        storeToken((response.data as any).token);
        setUser(response.data);
        return { ok: true, email };
      }
      return {
        ok: false,
        message: response.message || 'Verification failed. Please check your code.',
      };
    } catch {
      return { ok: false, message: 'Verification failed. Please check your code.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        verifyEmail,
        logout,
        hydrateSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ ok: false }),
  register: async () => ({ ok: false }),
  verifyEmail: async () => ({ ok: false }),
  logout: async () => {},
  hydrateSession: async () => null,
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    return defaultAuthContext;
  }
  return context;
};