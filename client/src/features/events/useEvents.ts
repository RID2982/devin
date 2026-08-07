import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, buildQueryString } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Paginated } from '@app/shared';

export interface EventRecord {
  id: string;
  name: string;
  category: string | null;
  date: string;
  endDate: string | null;
  time: string | null;
  venue: string | null;
  budget: string | null;
  status: string;
  priority: string;
  color: string | null;
  description: string | null;
  coverImagePath: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  eventPeople?: Array<{ id: string; personId: string; roleOnEvent: string | null; person: import('@/features/people/usePeople').PersonRecord }>;
}

export interface EventListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  month?: string;
  archived?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export function useEventsQuery(params: EventListParams = {}) {
  return useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => apiClient.get<Paginated<EventRecord>>(`/events${buildQueryString(params as Record<string, string>)}`),
  });
}

export function useEventQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.events.detail(id ?? ''),
    queryFn: () => apiClient.get<EventRecord>(`/events/${id}`),
    enabled: Boolean(id),
  });
}

export function useEventSummaryQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.events.summary(id ?? ''),
    queryFn: () => apiClient.get(`/events/${id}/summary`),
    enabled: Boolean(id),
  });
}

export function useEventTimelineQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.events.timeline(id ?? ''),
    queryFn: () => apiClient.get(`/events/${id}/timeline`),
    enabled: Boolean(id),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post<EventRecord>('/events', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      qc.invalidateQueries({ queryKey: ['planner'] });
    },
  });
}

export function useUpdateEvent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.patch<EventRecord>(`/events/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
      qc.invalidateQueries({ queryKey: queryKeys.events.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useArchiveEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/events/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/events/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      qc.invalidateQueries({ queryKey: ['planner'] });
    },
  });
}

export function useRestoreEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/events/${id}/restore`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.events.all }),
  });
}

export function useAddEventPerson(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (personId: string) => apiClient.post(`/events/${eventId}/people/${personId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) }),
  });
}

export function useRemoveEventPerson(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (personId: string) => apiClient.delete(`/events/${eventId}/people/${personId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) }),
  });
}

export function useApplyTemplate(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => apiClient.post(`/events/${eventId}/apply-template/${templateId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.checklist(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.events.summary(eventId) });
    },
  });
}
