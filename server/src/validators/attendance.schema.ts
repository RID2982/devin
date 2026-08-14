import { z } from 'zod';
import { ATTENDANCE_STATUSES } from '@app/shared';

export const markAttendanceSchema = z.object({
  status: z.enum(ATTENDANCE_STATUSES),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
