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
  expenses: Array<{ id: string; name: string; amount: number; category?: string; date: string }> | null;
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

export type EventListParams = {
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
};

export function useEventsQuery(params: EventListParams = {}) {
  return useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => apiClient.get<Paginated<EventRecord>>(`/events${buildQueryString(params)}`),
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

/**
 * Every event mutation touches the same screens: the events list, the dashboard
 * counters, the Monthly Planner and the attention buckets. Invalidating them
 * from one place is what stops a mutation quietly forgetting one and leaving a
 * stale card behind.
 */
function invalidateEventRelated(qc: ReturnType<typeof useQueryClient>, id?: string) {
  qc.invalidateQueries({ queryKey: queryKeys.events.all });
  qc.invalidateQueries({ queryKey: queryKeys.dashboard });
  qc.invalidateQueries({ queryKey: ['planner'] });
  qc.invalidateQueries({ queryKey: queryKeys.attention });
  if (id) qc.invalidateQueries({ queryKey: queryKeys.events.detail(id) });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post<EventRecord>('/events', data),
    onSuccess: () => invalidateEventRelated(qc),
  });
}

export function useUpdateEvent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.patch<EventRecord>(`/events/${id}`, data),
    onSuccess: () => invalidateEventRelated(qc, id),
  });
}

/**
 * Soft delete. `DELETE /events/:id` sets `archivedAt` on the server — the event
 * stays in the database and can be brought back from the Archive page. There is
 * deliberately no `useDeleteEvent`: one existed, byte-identical to this, and the
 * name alone convinced a call site it was performing a permanent delete.
 */
export function useArchiveEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/events/${id}`),
    onSuccess: () => invalidateEventRelated(qc),
  });
}

export function useRestoreEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/events/${id}/restore`),
    onSuccess: () => invalidateEventRelated(qc),
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
