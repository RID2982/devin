import { z } from 'zod';

export const createChecklistItemSchema = z
  .object({
    label: z.string().min(1).max(255),
    eventId: z.string().uuid().optional(),
    taskId: z.string().uuid().optional(),
  })
  .refine((v) => Boolean(v.eventId) !== Boolean(v.taskId), {
    message: 'Exactly one of eventId or taskId must be set',
  });

export const updateChecklistItemSchema = z.object({
  label: z.string().min(1).max(255).optional(),
  isDone: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const reorderChecklistSchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), order: z.number().int() })),
});

export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
