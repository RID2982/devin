import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export interface TagRecord {
  id: string;
  name: string;
  color: string | null;
}

export function useTagsQuery() {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: () => apiClient.get<TagRecord[]>('/tags'),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string }) => apiClient.post<TagRecord>('/tags', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tags }),
  });
}
