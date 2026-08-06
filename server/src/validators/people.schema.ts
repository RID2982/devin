import { z } from 'zod';

export const createPersonSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().max(40).optional(),
  role: z.string().max(120).optional(),
  department: z.string().max(120).optional(),
  organization: z.string().max(255).optional(),
  skills: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updatePersonSchema = createPersonSchema.partial();

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
