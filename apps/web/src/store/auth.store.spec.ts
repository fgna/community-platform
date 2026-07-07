import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './auth.store';
import { type AuthUser, Role } from '@community/shared';

const mockUser: AuthUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: Role.MEMBER,
  avatarUrl: null,
};

function resetStore() {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  });
  localStorage.clear();
  document.cookie = 'auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
}

describe('useAuthStore', () => {
  beforeEach(resetStore);

  describe('setAuth', () => {
    it('sets user, tokens, and isAuthenticated', () => {
      useAuthStore.getState().setAuth(mockUser, 'access-123', 'refresh-456');
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('access-123');
      expect(state.refreshToken).toBe('refresh-456');
      expect(state.isAuthenticated).toBe(true);
    });

    it('writes auth-session and user-role cookies', () => {
      useAuthStore.getState().setAuth(mockUser, 'tok', 'ref');
      expect(document.cookie).toContain('auth-session=tok');
      expect(document.cookie).toContain('user-role=MEMBER');
    });
  });

  describe('setAccessToken', () => {
    it('updates only the access token', () => {
      useAuthStore.getState().setAuth(mockUser, 'old-token', 'ref');
      useAuthStore.getState().setAccessToken('new-token');
      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-token');
      expect(state.refreshToken).toBe('ref');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('updateUser', () => {
    it('merges partial update into existing user', () => {
      useAuthStore.getState().setAuth(mockUser, 'tok', 'ref');
      useAuthStore.getState().updateUser({ name: 'Updated Name' });
      const state = useAuthStore.getState();
      expect(state.user?.name).toBe('Updated Name');
      expect(state.user?.email).toBe('test@example.com');
    });

    it('does nothing when user is null', () => {
      useAuthStore.getState().updateUser({ name: 'Updated' });
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('clearAuth', () => {
    it('clears all auth state', () => {
      useAuthStore.getState().setAuth(mockUser, 'tok', 'ref');
      useAuthStore.getState().clearAuth();
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('clears auth cookies', () => {
      useAuthStore.getState().setAuth(mockUser, 'tok', 'ref');
      useAuthStore.getState().clearAuth();
      expect(document.cookie).not.toContain('auth-session=tok');
    });
  });

  describe('initial state', () => {
    it('starts unauthenticated with no tokens', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
