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
    queryFn: () => apiClient.get<Paginated<PersonRecord>>(`/people${buildQueryString(params)}`),
  });
}

function invalidatePeopleRelated(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.people.all });
  qc.invalidateQueries({ queryKey: queryKeys.dashboard });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post<PersonRecord>('/people', data),
    onSuccess: () => invalidatePeopleRelated(qc),
  });
}

export function useUpdatePerson(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.patch<PersonRecord>(`/people/${id}`, data),
    onSuccess: () => invalidatePeopleRelated(qc),
  });
}

/**
 * Soft delete — `DELETE /people/:id` sets `archivedAt`. The person keeps their
 * event assignments and task history and can be restored from the Archive page.
 * (`useDeletePerson` used to sit alongside this doing exactly the same thing.)
 */
export function useArchivePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/people/${id}`),
    onSuccess: () => invalidatePeopleRelated(qc),
  });
}

export function useRestorePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/people/${id}/restore`),
    onSuccess: () => invalidatePeopleRelated(qc),
  });
}
