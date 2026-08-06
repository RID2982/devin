import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export interface TemplateItemRecord {
  id: string;
  templateId: string;
  label: string;
  order: number;
}

export interface TemplateRecord {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  isBuiltIn: boolean;
  items: TemplateItemRecord[];
}

export function useTemplatesQuery() {
  return useQuery({
    queryKey: queryKeys.templates,
    queryFn: () => apiClient.get<TemplateRecord[]>('/templates'),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; category?: string; items?: string[] }) =>
      apiClient.post<TemplateRecord>('/templates', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.templates }),
  });
}

export function useArchiveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.templates }),
  });
}
