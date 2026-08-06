import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export interface CalendarItem {
  id: string;
  type: 'event' | 'task';
  title: string;
  date: string | null;
  status: string;
  priority: string;
  venue?: string | null;
  color?: string | null;
  eventId?: string;
}

export function useCalendarQuery(from: Date, to: Date) {
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  return useQuery({
    queryKey: queryKeys.calendar(fromIso, toIso),
    queryFn: () => apiClient.get<{ events: CalendarItem[]; tasks: CalendarItem[] }>(`/calendar?from=${fromIso}&to=${toIso}`),
  });
}
