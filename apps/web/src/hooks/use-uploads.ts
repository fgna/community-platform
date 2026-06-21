import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await apiClient.post('/uploads/image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data as { url: string; key: string; id: string };
    },
  });
}

export function useUploadFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await apiClient.post('/uploads/file', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data as { url: string; key: string; id: string };
    },
  });
}

export function useDeleteUpload() {
  return useMutation({
    mutationFn: (key: string) =>
      apiClient.delete(`/uploads/${key}`).then((r) => r.data),
  });
}
