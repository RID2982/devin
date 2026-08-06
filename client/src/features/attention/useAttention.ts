import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { EventRecord } from '@/features/events/useEvents';
import type { TaskRecord } from '@/features/tasks/useTasks';

export interface AttentionResponse {
  overdueTasks: TaskRecord[];
  highPriorityTasks: TaskRecord[];
  upcomingDeadlines: TaskRecord[];
  unassignedTasks: TaskRecord[];
  incompleteChecklists: EventRecord[];
  missingDocuments: EventRecord[];
  budgetPending: EventRecord[];
}

export function useAttentionQuery() {
  return useQuery({
    queryKey: queryKeys.attention,
    queryFn: () => apiClient.get<AttentionResponse>('/attention'),
  });
}
