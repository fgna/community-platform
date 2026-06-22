import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useAssessmentQuestions() {
  return useQuery({
    queryKey: ['assessment-questions'],
    queryFn: () => apiClient.get('/assessments/questions').then((r) => r.data),
    staleTime: Infinity,
  });
}

export function useLatestAssessment() {
  return useQuery({
    queryKey: ['assessment-latest'],
    queryFn: () => apiClient.get('/assessments/latest').then((r) => r.data),
  });
}

export function useAssessmentHistory(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['assessments', page, limit],
    queryFn: () =>
      apiClient.get('/assessments', { params: { page, limit } }).then((r) => r.data),
  });
}

export function useSubmitAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answers: { questionId: string; score: number }[]) =>
      apiClient.post('/assessments', { answers }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-latest'] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
}
