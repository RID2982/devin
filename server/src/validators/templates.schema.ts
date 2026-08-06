import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().optional(),
  category: z.string().max(100).optional(),
  items: z.array(z.string().min(1)).optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().optional(),
  category: z.string().max(100).optional(),
});

export const createTemplateItemSchema = z.object({
  label: z.string().min(1).max(255),
  order: z.number().int().optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
