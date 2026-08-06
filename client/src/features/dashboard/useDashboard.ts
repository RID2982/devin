import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export interface DashboardOverview {
  stats: {
    totalEvents: number;
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    overdueTasks: number;
    highPriorityTasks: number;
    thisMonthEvents: number;
    upcomingDeadlines: number;
  };
  widgets: {
    upcomingEvents: Array<{ id: string; name: string; date: string; venue: string | null; status: string; priority: string; color: string | null }>;
    todaysTasks: Array<{ id: string; title: string; priority: string; status: string; eventId: string }>;
    recentlyCompleted: Array<{ id: string; title: string; updatedAt: string; eventId: string }>;
    recentActivity: Array<{ id: string; summary: string; createdAt: string; action: string }>;
    attentionItems?: { overdueCount: number; highPriorityCount: number; upcomingDeadlinesCount: number };
    attention?: any;
  };
}

export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => apiClient.get<DashboardOverview>('/dashboard/overview'),
    refetchInterval: 60_000,
  });
}
