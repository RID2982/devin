import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, buildQueryString } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { AttendanceStatus } from '@app/shared';

export interface AttendanceRow {
  personId: string;
  roleOnEvent: string | null;
  name: string;
  email: string | null;
  avatarPath: string | null;
  status: AttendanceStatus | null;
  markedAt: string | null;
}

export function useAttendanceQuery(eventId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.attendance(eventId),
    queryFn: () => apiClient.get<AttendanceRow[]>(`/attendance${buildQueryString({ eventId })}`),
    enabled: Boolean(eventId),
  });
}

export function useMarkAttendance(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ personId, status }: { personId: string; status: AttendanceStatus }) =>
      apiClient.patch(`/attendance/${eventId}/${personId}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.attendance(eventId) }),
  });
}
