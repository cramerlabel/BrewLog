import { z } from 'zod';
import { batchStatusSchema, brewTypeSchema } from './enums.js';
import { recipeIngredientInputSchema, recipeStepInputSchema } from './recipes.js';
import { optionalNumber, optionalText } from './utils.js';

export const batchIngredientInputSchema = recipeIngredientInputSchema;
export type BatchIngredientInput = z.infer<typeof batchIngredientInputSchema>;

export const batchStepInputSchema = recipeStepInputSchema.extend({
  isDone: z.boolean().default(false),
});
export type BatchStepInput = z.infer<typeof batchStepInputSchema>;

export const createBatchSchema = z
  .object({
    recipeId: z.number().int().positive().optional(),
    name: z.string().trim().min(1, 'Name is required').max(120),
    // Required only when not starting from a recipe (recipe supplies its own type otherwise).
    type: brewTypeSchema.optional(),
    startDate: z.string().trim().min(1, 'Start date is required'),
    notes: optionalText(2000),
    ingredients: z.array(recipeIngredientInputSchema).default([]),
    steps: z.array(recipeStepInputSchema).default([]),
  })
  .refine((data) => Boolean(data.recipeId) || Boolean(data.type), {
    message: 'Type is required when not starting from a recipe',
    path: ['type'],
  });
export type CreateBatchInput = z.infer<typeof createBatchSchema>;

export const updateBatchSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  type: brewTypeSchema,
  status: batchStatusSchema,
  startDate: z.string().trim().min(1, 'Start date is required'),
  endDate: optionalText(30),
  finalYieldAmount: optionalNumber(z.number().nonnegative()),
  finalYieldUnit: optionalText(20),
  finalAbv: optionalNumber(z.number().min(0).max(100)),
  notes: optionalText(2000),
  ingredients: z.array(batchIngredientInputSchema).default([]),
  steps: z.array(batchStepInputSchema).default([]),
});
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;

export const batchLogEntryInputSchema = z.object({
  entryDate: z.string().trim().min(1, 'Date is required'),
  actionId: optionalNumber(z.number().int().positive()),
  og: optionalNumber(z.number().min(0.9).max(2)),
  fg: optionalNumber(z.number().min(0.9).max(2)),
  brix: optionalNumber(z.number().min(0).max(50)),
  sg: optionalNumber(z.number().min(0.9).max(2)),
  ph: optionalNumber(z.number().min(0).max(14)),
  temperature: optionalNumber(z.number().min(-50).max(250)),
  temperatureUnit: optionalText(10),
  notes: optionalText(2000),
});
export type BatchLogEntryInput = z.infer<typeof batchLogEntryInputSchema>;
