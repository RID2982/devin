import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, buildQueryString } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Paginated } from '@app/shared';

export interface TaskRecord {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: string;
  status: string;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  order: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  priority?: string;
  eventId?: string;
  archived?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export function useTasksQuery(params: TaskListParams = {}) {
  return useQuery({
    queryKey: queryKeys.tasks.list(params),
    queryFn: () => apiClient.get<Paginated<TaskRecord>>(`/tasks${buildQueryString(params as Record<string, string>)}`),
  });
}

function invalidateTaskRelated(qc: ReturnType<typeof useQueryClient>, eventId?: string) {
  qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
  qc.invalidateQueries({ queryKey: queryKeys.dashboard });
  qc.invalidateQueries({ queryKey: queryKeys.attention });
  if (eventId) {
    qc.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
    qc.invalidateQueries({ queryKey: queryKeys.events.summary(eventId) });
  }
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post<TaskRecord>('/tasks', data),
    onSuccess: (task) => invalidateTaskRelated(qc, task.eventId),
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.patch<TaskRecord>(`/tasks/${id}`, data),
    onSuccess: (task) => invalidateTaskRelated(qc, task.eventId),
  });
}

export function useSetTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiClient.patch<TaskRecord>(`/tasks/${id}/status`, { status }),
    onSuccess: (task) => invalidateTaskRelated(qc, task.eventId),
  });
}

export function useArchiveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tasks/${id}`),
    onSuccess: () => invalidateTaskRelated(qc),
  });
}

export function useAssignPerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, personId }: { taskId: string; personId: string }) => apiClient.post(`/tasks/${taskId}/assignees/${personId}`),
    onSuccess: () => invalidateTaskRelated(qc),
  });
}

export function useUnassignPerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, personId }: { taskId: string; personId: string }) => apiClient.delete(`/tasks/${taskId}/assignees/${personId}`),
    onSuccess: () => invalidateTaskRelated(qc),
  });
}
