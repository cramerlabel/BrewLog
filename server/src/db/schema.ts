import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  // Keep in sync with shared `userRoleSchema`.
  role: text('role', { enum: ['admin', 'user'] })
    .notNull()
    .default('user'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
});

// Backs express-session; sess holds the serialized session JSON blob.
export const sessions = sqliteTable('sessions', {
  sid: text('sid').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sess: text('sess').notNull(),
  expiresAt: integer('expires_at').notNull(),
});

export const actions = sqliteTable('actions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  // Keep in sync with shared `applicableToSchema`.
  applicableTo: text('applicable_to', { enum: ['beer', 'wine', 'both'] })
    .notNull()
    .default('both'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
});

export const recipes = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  // Keep in sync with shared `brewTypeSchema`.
  type: text('type', { enum: ['beer', 'wine'] }).notNull(),
  style: text('style'),
  description: text('description'),
  batchSize: real('batch_size'),
  batchSizeUnit: text('batch_size_unit'),
  targetOg: real('target_og'),
  targetFg: real('target_fg'),
  targetAbv: real('target_abv'),
  photoPath: text('photo_path'),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
});

export const recipeIngredients = sqliteTable('recipe_ingredients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  category: text('category').notNull(),
  name: text('name').notNull(),
  amount: real('amount'),
  unit: text('unit'),
  notes: text('notes'),
});

export const recipeSteps = sqliteTable('recipe_steps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(),
  text: text('text').notNull(),
});

export const batches = sqliteTable('batches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // Nullable: keeps the batch intact for provenance even if the source recipe is deleted.
  recipeId: integer('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  recipeNameSnapshot: text('recipe_name_snapshot'),
  type: text('type', { enum: ['beer', 'wine'] }).notNull(),
  name: text('name').notNull(),
  // Per-year human-readable code, e.g. "2026-001".
  batchNumber: text('batch_number').notNull().unique(),
  // Keep in sync with shared `batchStatusSchema`.
  status: text('status', {
    enum: ['planning', 'fermenting', 'conditioning', 'bottled_kegged', 'aging', 'completed', 'archived'],
  })
    .notNull()
    .default('planning'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  finalYieldAmount: real('final_yield_amount'),
  finalYieldUnit: text('final_yield_unit'),
  finalAbv: real('final_abv'),
  notes: text('notes'),
  ownerId: integer('owner_id')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
});

export const batchIngredients = sqliteTable('batch_ingredients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  batchId: integer('batch_id')
    .notNull()
    .references(() => batches.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  category: text('category').notNull(),
  name: text('name').notNull(),
  amount: real('amount'),
  unit: text('unit'),
  notes: text('notes'),
});

export const batchSteps = sqliteTable('batch_steps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  batchId: integer('batch_id')
    .notNull()
    .references(() => batches.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(),
  text: text('text').notNull(),
  isDone: integer('is_done', { mode: 'boolean' }).notNull().default(false),
});

export const batchLogEntries = sqliteTable('batch_log_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  batchId: integer('batch_id')
    .notNull()
    .references(() => batches.id, { onDelete: 'cascade' }),
  entryDate: text('entry_date').notNull(),
  actionId: integer('action_id').references(() => actions.id),
  og: real('og'),
  fg: real('fg'),
  brix: real('brix'),
  sg: real('sg'),
  ph: real('ph'),
  temperature: real('temperature'),
  temperatureUnit: text('temperature_unit'),
  notes: text('notes'),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
});

export const batchLogPhotos = sqliteTable('batch_log_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  logEntryId: integer('log_entry_id')
    .notNull()
    .references(() => batchLogEntries.id, { onDelete: 'cascade' }),
  // Randomized on-disk filename - never the original, to avoid path traversal / collisions.
  filePath: text('file_path').notNull(),
  originalFilename: text('original_filename').notNull(),
  uploadedAt: text('uploaded_at').notNull().default(sql`(current_timestamp)`),
});
