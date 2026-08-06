import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export interface AttachmentRecord {
  id: string;
  filename: string;
  storedPath: string;
  mimeType: string | null;
  sizeBytes: number | null;
  eventId: string | null;
  taskId: string | null;
  createdAt: string;
}

export function useAttachmentsQuery(eventId?: string, taskId?: string) {
  return useQuery({
    queryKey: queryKeys.attachments(eventId, taskId),
    queryFn: () => apiClient.get<AttachmentRecord[]>(`/attachments?${eventId ? `eventId=${eventId}` : `taskId=${taskId}`}`),
    enabled: Boolean(eventId || taskId),
  });
}

export function useUploadAttachment(eventId?: string, taskId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      if (eventId) formData.append('eventId', eventId);
      if (taskId) formData.append('taskId', taskId);
      return apiClient.post<AttachmentRecord>('/attachments', formData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attachments(eventId, taskId) });
      if (eventId) qc.invalidateQueries({ queryKey: queryKeys.events.timeline(eventId) });
    },
  });
}

export function useDeleteAttachment(eventId?: string, taskId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/attachments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.attachments(eventId, taskId) }),
  });
}

export function attachmentDownloadUrl(id: string) {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
  return `${base}/attachments/${id}/download`;
}
