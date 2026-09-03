import { z } from 'zod';
import { applicableToSchema } from './enums.js';

export const createActionSchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(500).optional().or(z.literal('')).transform((v) => v || undefined),
  applicableTo: applicableToSchema,
  sortOrder: z.number().int().min(0).default(0),
});
export type CreateActionInput = z.infer<typeof createActionSchema>;

export const updateActionSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  description: z.string().trim().max(500).optional().or(z.literal('')).transform((v) => v || undefined),
  applicableTo: applicableToSchema.optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type UpdateActionInput = z.infer<typeof updateActionSchema>;
