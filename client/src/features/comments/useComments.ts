import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export interface CommentRecord {
  id: string;
  body: string;
  authorUserId: string | null;
  eventId: string | null;
  taskId: string | null;
  createdAt: string;
}

export function useCommentsQuery(eventId?: string, taskId?: string) {
  return useQuery({
    queryKey: queryKeys.comments(eventId, taskId),
    queryFn: () => apiClient.get<CommentRecord[]>(`/comments?${eventId ? `eventId=${eventId}` : `taskId=${taskId}`}`),
    enabled: Boolean(eventId || taskId),
  });
}

export function useCreateComment(eventId?: string, taskId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => apiClient.post<CommentRecord>('/comments', { body, eventId, taskId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.comments(eventId, taskId) });
      if (eventId) qc.invalidateQueries({ queryKey: queryKeys.events.timeline(eventId) });
    },
  });
}
