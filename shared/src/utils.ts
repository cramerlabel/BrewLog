import { z } from 'zod';

// Converts empty-string/NaN form values to `undefined` so optional numeric fields work with
// plain HTML number inputs (which yield '' when empty and NaN via RHF's valueAsNumber).
export function optionalNumber(schema: z.ZodNumber) {
  return z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isNaN(num) ? undefined : num;
  }, schema.optional());
}

export function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined);
}
