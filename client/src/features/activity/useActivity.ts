import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export interface ActivityLogRecord {
  id: string;
  action: string;
  summary: string;
  eventId: string | null;
  taskId: string | null;
  createdAt: string;
}

export function useActivityQuery(eventId?: string) {
  return useQuery({
    queryKey: queryKeys.activity(eventId),
    queryFn: () => apiClient.get<ActivityLogRecord[]>(`/activity${eventId ? `?eventId=${eventId}` : ''}`),
  });
}
