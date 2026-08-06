import { PRIORITIES, EVENT_STATUSES } from '@app/shared';
import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().max(100).optional(),
  date: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  time: z.string().max(20).optional(),
  venue: z.string().max(255).optional(),
  budget: z.coerce.number().nonnegative().optional(),
  status: z.enum(EVENT_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  color: z.string().max(20).optional(),
  description: z.string().optional(),
  templateId: z.string().uuid().optional(),
});

export const updateEventSchema = createEventSchema.partial().omit({ templateId: true });

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
