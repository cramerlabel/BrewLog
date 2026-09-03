import { z } from 'zod';

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(32, 'Username must be at most 32 characters')
  .regex(/^[a-zA-Z0-9_.-]+$/, 'Username may only contain letters, numbers, "_", "." and "-"');

// Minimum length only - complexity rules tend to push users toward weaker, predictable passwords.
export const passwordSchema = z.string().min(10, 'Password must be at least 10 characters').max(200);

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});
export type ChangeOwnPasswordInput = z.infer<typeof changeOwnPasswordSchema>;

export const updateOwnProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
});
export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileSchema>;
