import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface LearningGroupMember {
  id: string;
  groupId: string;
  userId: string;
  joinedAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
}

export interface LearningGroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; avatarUrl: string | null };
}

export interface MemberGoal {
  id: string;
  title: string;
  progress: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  userId: string;
}

export interface LearningGroup {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; avatarUrl: string | null };
  members: LearningGroupMember[];
  _count: { members: number; messages: number };
}

export interface LearningGroupDetail extends LearningGroup {
  messages: LearningGroupMessage[];
  isMember: boolean;
}

export interface PaginatedMessages {
  data: LearningGroupMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useLearningGroups() {
  return useQuery({
    queryKey: ['learning-groups'],
    queryFn: async () => {
      const { data } = await apiClient.get<LearningGroup[]>('/learning-groups');
      return data;
    },
  });
}

export function useLearningGroup(id: string) {
  return useQuery({
    queryKey: ['learning-group', id],
    queryFn: async () => {
      const { data } = await apiClient.get<LearningGroupDetail>(
        `/learning-groups/${id}`,
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data } = await apiClient.post<LearningGroup>(
        '/learning-groups',
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-groups'] });
    },
  });
}

export function useAddGroupMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await apiClient.post(
        `/learning-groups/${groupId}/members`,
        { userId },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['learning-groups'] });
    },
  });
}

export function useRemoveGroupMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await apiClient.delete(
        `/learning-groups/${groupId}/members/${userId}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['learning-groups'] });
    },
  });
}

export function useGroupMessages(groupId: string, page = 1) {
  return useQuery({
    queryKey: ['learning-group-messages', groupId, page],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedMessages>(
        `/learning-groups/${groupId}/messages`,
        { params: { page, limit: 50 } },
      );
      return data;
    },
    enabled: !!groupId,
  });
}

export function useSendGroupMessage(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await apiClient.post<LearningGroupMessage>(
        `/learning-groups/${groupId}/messages`,
        { content },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['learning-group-messages', groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ['learning-group', groupId],
      });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data } = await apiClient.post(`/learning-groups/${groupId}/join`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-groups'] });
      queryClient.invalidateQueries({ queryKey: ['learning-group'] });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data } = await apiClient.delete(`/learning-groups/${groupId}/leave`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-groups'] });
      queryClient.invalidateQueries({ queryKey: ['learning-group'] });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/learning-groups/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-groups'] });
    },
  });
}
