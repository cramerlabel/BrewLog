import { z } from 'zod';

// Roles a user account can have.
export const userRoleSchema = z.enum(['admin', 'user']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Brewing discipline shared by recipes and batches.
export const brewTypeSchema = z.enum(['beer', 'wine']);
export type BrewType = z.infer<typeof brewTypeSchema>;

// Which brew type(s) an Actions-list entry applies to.
export const applicableToSchema = z.enum(['beer', 'wine', 'both']);
export type ApplicableTo = z.infer<typeof applicableToSchema>;

// Lifecycle of a batch; "open" batches are anything except completed/archived.
export const batchStatusSchema = z.enum([
  'planning',
  'fermenting',
  'conditioning',
  'bottled_kegged',
  'aging',
  'completed',
  'archived',
]);
export type BatchStatus = z.infer<typeof batchStatusSchema>;

export const OPEN_BATCH_STATUSES: BatchStatus[] = [
  'planning',
  'fermenting',
  'conditioning',
  'bottled_kegged',
  'aging',
];
