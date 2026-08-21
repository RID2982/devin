import { createContext } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

export interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: AuthUser | null;
  accessToken: string | null;
}

export interface AuthContextValue extends AuthState {
  signIn(email: string, password: string, rememberMe?: boolean): Promise<void>;
  signOut(): void;
}

/**
 * Lives apart from both the provider and the hook so neither file exports a mix
 * of components and non-components — which is what React Fast Refresh needs in
 * order to hot-update the auth module instead of reloading the whole app.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);
