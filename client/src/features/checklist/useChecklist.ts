import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export interface ChecklistItemRecord {
  id: string;
  label: string;
  isDone: boolean;
  order: number;
  eventId: string | null;
  taskId: string | null;
  completedAt: string | null;
}

export function useChecklistQuery(eventId?: string, taskId?: string) {
  return useQuery({
    queryKey: queryKeys.checklist(eventId, taskId),
    queryFn: () => apiClient.get<ChecklistItemRecord[]>(`/checklist-items?${eventId ? `eventId=${eventId}` : `taskId=${taskId}`}`),
    enabled: Boolean(eventId || taskId),
  });
}

export function useCreateChecklistItem(eventId?: string, taskId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (label: string) => apiClient.post<ChecklistItemRecord>('/checklist-items', { label, eventId, taskId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.checklist(eventId, taskId) }),
  });
}

export function useUpdateChecklistItem(eventId?: string, taskId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; label?: string; isDone?: boolean }) =>
      apiClient.patch<ChecklistItemRecord>(`/checklist-items/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.checklist(eventId, taskId) });
      if (eventId) qc.invalidateQueries({ queryKey: queryKeys.events.summary(eventId) });
    },
  });
}

export function useDeleteChecklistItem(eventId?: string, taskId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/checklist-items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.checklist(eventId, taskId) }),
  });
}

export function useReorderChecklist(eventId?: string, taskId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: string; order: number }[]) => apiClient.patch('/checklist-items/reorder', { items }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.checklist(eventId, taskId) }),
  });
}
