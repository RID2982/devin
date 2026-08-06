import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { EventRecord } from '@/features/events/useEvents';

export interface PlannerResponse {
  year: number;
  months: Array<{ month: number; events: EventRecord[] }>;
}

export function usePlannerQuery(year: number) {
  return useQuery({
    queryKey: queryKeys.planner(year),
    queryFn: () => apiClient.get<PlannerResponse>(`/planner/${year}`),
  });
}
