import { create } from 'zustand';
import type { UserProfile } from '@turboorder/shared';

interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  setAuth: (token: string, user: UserProfile) => void;
  setAccessToken: (token: string) => void;
  setInitialized: (val: boolean) => void;
  logout: () => void;
}

/**
 * Auth store — manages authentication state.
 * Access token stored in memory (Zustand) — NOT localStorage (XSS prevention).
 * Refresh token stored in httpOnly cookie (managed by browser).
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: (token, user) =>
    set({ accessToken: token, user, isAuthenticated: true, isInitialized: true }),

  setAccessToken: (token) =>
    set({ accessToken: token }),

  setInitialized: (val) =>
    set({ isInitialized: val }),

  logout: () =>
    set({ accessToken: null, user: null, isAuthenticated: false }),
}));
