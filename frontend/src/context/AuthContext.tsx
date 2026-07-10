import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, tokenStore } from '../api/client';
import type { AuthResponse } from '../api/types';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    useCase?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(tokenStore.get());
  const queryClient = useQueryClient();

  const handleAuth = useCallback((response: AuthResponse) => {
    tokenStore.set(response.accessToken);
    setToken(response.accessToken);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token),
      login: async (email, password) => {
        handleAuth(await api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }));
      },
      register: async (data) => {
        handleAuth(await api<AuthResponse>('/auth/register', { method: 'POST', body: data }));
      },
      logout: () => {
        tokenStore.clear();
        setToken(null);
        queryClient.clear();
      },
    }),
    [token, handleAuth, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
