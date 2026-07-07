import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import apiClient from '@/lib/api-client';
import type { LoginResponse } from '@community/shared';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, accessToken, setAuth, clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      // refreshToken is now an httpOnly cookie — not in response body
      setAuth(data.user, data.accessToken);
      router.push('/dashboard');
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: { email: string; name: string; password: string; inviteToken?: string }) => {
      const { data } = await apiClient.post<LoginResponse>('/auth/register', credentials);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      router.push('/dashboard');
    },
  });

  const oauthLoginMutation = useMutation({
    mutationFn: async ({ provider, code, redirectUri }: { provider: string; code: string; redirectUri: string }) => {
      const { data } = await apiClient.post<LoginResponse>(`/auth/oauth/${provider}`, { code, redirectUri });
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      router.push('/dashboard');
    },
  });

  const logout = useCallback(async () => {
    try {
      // POST to logout — the httpOnly refresh_token cookie is cleared server-side
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      clearAuth();
      queryClient.clear();
      router.push('/login');
    }
  }, [clearAuth, queryClient, router]);

  return {
    user,
    isAuthenticated,
    accessToken,
    login: loginMutation.mutateAsync,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    registerLoading: registerMutation.isPending,
    registerError: registerMutation.error,
    oauthLogin: oauthLoginMutation.mutateAsync,
    oauthLoginLoading: oauthLoginMutation.isPending,
    oauthLoginError: oauthLoginMutation.error,
    logout,
  };
}
