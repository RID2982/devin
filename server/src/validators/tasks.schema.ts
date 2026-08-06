import { PRIORITIES, TASK_STATUSES } from '@app/shared';
import { z } from 'zod';

export const createTaskSchema = z.object({
  eventId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  deadline: z.coerce.date().optional(),
  priority: z.enum(PRIORITIES).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  estimatedMinutes: z.coerce.number().int().nonnegative().optional(),
  actualMinutes: z.coerce.number().int().nonnegative().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().omit({ eventId: true });

export const updateTaskStatusSchema = z.object({ status: z.enum(TASK_STATUSES) });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
