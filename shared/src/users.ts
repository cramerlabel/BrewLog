import { z } from 'zod';
import { userRoleSchema } from './enums.js';
import { passwordSchema, usernameSchema } from './auth.js';

export const createUserSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().optional().or(z.literal('')).transform((v) => v || undefined),
  role: userRoleSchema,
  password: passwordSchema,
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().email().optional().or(z.literal('')).transform((v) => v || undefined),
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const adminResetPasswordSchema = z.object({
  newPassword: passwordSchema,
});
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
