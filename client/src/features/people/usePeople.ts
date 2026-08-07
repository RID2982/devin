import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, buildQueryString } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Paginated } from '@app/shared';

export interface PersonRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  department: string | null;
  organization: string | null;
  skills: string[] | null;
  avatarPath: string | null;
  notes: string | null;
  isActive: boolean;
  archivedAt: string | null;
}

export function usePeopleQuery(params: { search?: string; archived?: boolean; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.people.list(params),
    queryFn: () => apiClient.get<Paginated<PersonRecord>>(`/people${buildQueryString(params as Record<string, string>)}`),
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post<PersonRecord>('/people', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.people.all }),
  });
}

export function useUpdatePerson(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.patch<PersonRecord>(`/people/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.people.all }),
  });
}

export function useArchivePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/people/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.people.all }),
  });
}

export function useDeletePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/people/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.people.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
