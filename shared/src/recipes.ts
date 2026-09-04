import { z } from 'zod';
import { brewTypeSchema } from './enums.js';
import { optionalNumber, optionalText } from './utils.js';

export const recipeIngredientInputSchema = z.object({
  id: z.number().int().optional(),
  category: z.string().trim().min(1, 'Category is required').max(60),
  name: z.string().trim().min(1, 'Name is required').max(120),
  amount: optionalNumber(z.number().nonnegative()),
  unit: optionalText(30),
  notes: optionalText(500),
});
export type RecipeIngredientInput = z.infer<typeof recipeIngredientInputSchema>;

export const recipeStepInputSchema = z.object({
  id: z.number().int().optional(),
  text: z.string().trim().min(1, 'Step text is required').max(2000),
});
export type RecipeStepInput = z.infer<typeof recipeStepInputSchema>;

export const recipeInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  type: brewTypeSchema,
  style: optionalText(120),
  description: optionalText(4000),
  batchSize: optionalNumber(z.number().positive()),
  batchSizeUnit: optionalText(20),
  targetOg: optionalNumber(z.number().min(0.9).max(2)),
  targetFg: optionalNumber(z.number().min(0.9).max(2)),
  targetAbv: optionalNumber(z.number().min(0).max(100)),
  ingredients: z.array(recipeIngredientInputSchema).default([]),
  steps: z.array(recipeStepInputSchema).default([]),
});
export type RecipeInput = z.infer<typeof recipeInputSchema>;
