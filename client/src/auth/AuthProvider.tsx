import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: AuthUser | null;
  accessToken: string | null;
}

interface AuthContextValue extends AuthState {
  signIn(email: string, password: string, rememberMe?: boolean): Promise<void>;
  signOut(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_STORAGE_KEY = 'auth_token';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

/**
 * "Remember me" is purely a client-side storage choice — it does not touch the
 * login endpoint or token format. Checked: token survives browser restarts
 * (localStorage). Unchecked: token is cleared when the tab/browser closes
 * (sessionStorage).
 */
function readStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY) ?? sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

function writeStoredToken(token: string, rememberMe: boolean) {
  if (rememberMe) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } else {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null, accessToken: null });

  useEffect(() => {
    const token = readStoredToken();
    if (!token) {
      setState({ status: 'unauthenticated', user: null, accessToken: null });
      return;
    }

    fetch(`${API_URL}/auth/session`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Session invalid'))))
      .then((data) => setState({ status: 'authenticated', user: data.user, accessToken: token }))
      .catch(() => {
        clearStoredToken();
        setState({ status: 'unauthenticated', user: null, accessToken: null });
      });
  }, []);

  const signIn = useCallback(async (email: string, password: string, rememberMe = true) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error?.message ?? 'Invalid email or password');
    }
    const data = await res.json();
    writeStoredToken(data.token, rememberMe);
    setState({ status: 'authenticated', user: data.user, accessToken: data.token });
  }, []);

  const signOut = useCallback(() => {
    clearStoredToken();
    setState({ status: 'unauthenticated', user: null, accessToken: null });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ ...state, signIn, signOut }), [state, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
