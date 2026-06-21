import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { PaginatedPosts } from '@community/shared';

export function useFeed(page = 1, limit = 20, type?: string) {
  return useQuery({
    queryKey: ['feed', page, limit, type],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (type) params.type = type;
      const { data } = await apiClient.get<PaginatedPosts>('/posts', { params });
      return data;
    },
  });
}

export function useTrendingFeed(limit = 20) {
  return useQuery({
    queryKey: ['feed', 'trending', limit],
    queryFn: async () => {
      const { data } = await apiClient.get('/posts/trending', { params: { limit } });
      return data as { data: any[]; total: number };
    },
    refetchInterval: 60_000,
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/posts/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

interface CreatePostPayload {
  content: string;
  type?: 'DISCUSSION' | 'QUESTION' | 'ANNOUNCEMENT' | 'INTRODUCTION' | 'SUCCESS_STORY';
  categoryIds?: string[];
  poll?: {
    question: string;
    options: string[];
    endsAt?: string;
  };
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePostPayload) => {
      const { data } = await apiClient.post('/posts', payload);
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await apiClient.post(`/posts/${postId}/comments`, { content });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useToggleReaction(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (type: string) => {
      const { data } = await apiClient.post(`/posts/${postId}/reactions/${type}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await apiClient.delete(`/posts/${postId}`);
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
