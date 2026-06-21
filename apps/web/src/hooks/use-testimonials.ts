import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface Testimonial {
  id: string;
  authorId: string;
  content: string;
  role: string | null;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

interface PaginatedTestimonials {
  data: Testimonial[];
  total: number;
  page: number;
  limit: number;
}

export function useTestimonials(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['testimonials', page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedTestimonials>('/testimonials', {
        params: { page, limit },
      });
      return data;
    },
  });
}

export function useCreateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { content: string; role?: string }) => {
      const { data } = await apiClient.post<Testimonial>('/testimonials', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });
}
