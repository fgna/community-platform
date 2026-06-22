import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  mood: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertJournalInput {
  content: string;
  mood?: string;
}

export interface JournalStats {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  last30DaysCount: number;
  entriesByDate: Record<string, boolean>;
}

export function useJournalEntries(month?: string) {
  return useQuery({
    queryKey: ['journal', 'entries', month],
    queryFn: async () => {
      const params = month ? { month } : {};
      const { data } = await apiClient.get<JournalEntry[]>('/journal', { params });
      return data;
    },
  });
}

export function useJournalEntry(date: string | null) {
  return useQuery({
    queryKey: ['journal', 'entry', date],
    queryFn: async () => {
      const { data } = await apiClient.get<JournalEntry>(`/journal/${date}`);
      return data;
    },
    enabled: !!date,
    retry: false,
  });
}

export function useUpsertJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, ...input }: UpsertJournalInput & { date: string }) => {
      const { data } = await apiClient.put<JournalEntry>(`/journal/${date}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}

export function useDeleteJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (date: string) => {
      const { data } = await apiClient.delete(`/journal/${date}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}

export function useJournalStats() {
  return useQuery({
    queryKey: ['journal', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<JournalStats>('/journal/stats');
      return data;
    },
  });
}

export interface JournalPrompt {
  id: string;
  category: string;
  text: string;
  color: string;
}

export function useJournalPrompts() {
  return useQuery({
    queryKey: ['journal-prompts'],
    queryFn: async () => {
      const { data } = await apiClient.get<JournalPrompt[]>('/journal/prompts');
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
