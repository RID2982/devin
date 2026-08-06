import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { EventRecord } from '@/features/events/useEvents';
import type { TaskRecord } from '@/features/tasks/useTasks';
import type { PersonRecord } from '@/features/people/usePeople';

export function useSearchQuery(q: string) {
  return useQuery({
    queryKey: queryKeys.search(q),
    queryFn: () => apiClient.get<{ events: EventRecord[]; tasks: TaskRecord[]; people: PersonRecord[] }>(`/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length > 0,
  });
}
