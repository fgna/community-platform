import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@community/shared';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; SameSite=Lax; max-age=${COOKIE_MAX_AGE}`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
}

function syncAuthCookies(accessToken: string, role: string) {
  setCookie('auth-session', accessToken);
  setCookie('user-role', role);
}

function clearAuthCookies() {
  deleteCookie('auth-session');
  deleteCookie('user-role');
}

interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== 'undefined') syncAuthCookies(accessToken, user.role);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },
      setAccessToken: (token) => {
        if (typeof window !== 'undefined') setCookie('auth-session', token);
        set({ accessToken: token });
      },
      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),
      clearAuth: () => {
        if (typeof window !== 'undefined') clearAuthCookies();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'community-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated && state.accessToken && state.user && typeof window !== 'undefined') {
          syncAuthCookies(state.accessToken, state.user.role);
        }
      },
    },
  ),
);
