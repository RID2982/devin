import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export interface NoteRecord {
  id: string;
  title: string | null;
  bodyMarkdown: string;
  eventId: string | null;
  updatedAt: string;
}

export function useNotesQuery(eventId: string) {
  return useQuery({
    queryKey: queryKeys.notes(eventId),
    queryFn: () => apiClient.get<NoteRecord[]>(`/notes?eventId=${eventId}`),
    enabled: Boolean(eventId),
  });
}

export function useCreateNote(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title?: string; bodyMarkdown?: string }) => apiClient.post<NoteRecord>('/notes', { eventId, ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notes(eventId) }),
  });
}

export function useUpdateNote(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; bodyMarkdown?: string }) => apiClient.patch<NoteRecord>(`/notes/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notes(eventId) }),
  });
}
