import {
  batchLogEntryInputSchema,
  batchStatusSchema,
  createBatchSchema,
  type BatchStatus,
  updateBatchSchema,
} from '@brewlog/shared';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { Router, type Request } from 'express';
import { generateBatchNumber } from '../db/batch-number.js';
import { db, sqlite } from '../db/client.js';
import { now } from '../db/now.js';
import {
  actions,
  batchIngredients,
  batchLogEntries,
  batchLogPhotos,
  batches,
  batchSteps,
  recipeIngredients,
  recipes,
  recipeSteps,
  users,
} from '../db/schema.js';
import { requireAuth, requireOwnerOrAdmin } from '../middleware/auth.js';
import { createImageUpload, deleteUploadedFile, resolveUploadPath } from '../uploads/image-upload.js';

const router = Router();
const uploadLogPhoto = createImageUpload('batch-logs');

function loadBatchOwnerId(req: Request): number | null {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return null;
  const batch = db.select({ ownerId: batches.ownerId }).from(batches).where(eq(batches.id, id)).get();
  return batch ? batch.ownerId : null;
}

router.get('/', requireAuth, (req, res) => {
  const { status, type, search, page: pageParam, pageSize: pageSizeParam, ownerId: ownerIdParam } = req.query;

  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(pageSizeParam) || 20));
  const conditions = [];

  // Regular users only ever see their own batches - admins can optionally scope to one owner.
  if (req.user!.role === 'admin') {
    const ownerIdNum = Number(ownerIdParam);
    if (typeof ownerIdParam === 'string' && Number.isInteger(ownerIdNum)) {
      conditions.push(eq(batches.ownerId, ownerIdNum));
    }
  } else {
    conditions.push(eq(batches.ownerId, req.user!.id));
  }

  if (type === 'beer' || type === 'wine') {
    conditions.push(eq(batches.type, type));
  }

  const statusParam = typeof status === 'string' ? status : 'open';
  if (statusParam === 'open') {
    conditions.push(sql`${batches.status} NOT IN ('completed', 'archived')`);
  } else if (statusParam !== 'all' && batchStatusSchema.safeParse(statusParam).success) {
    conditions.push(eq(batches.status, statusParam as BatchStatus));
  }

  if (typeof search === 'string' && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    conditions.push(sql`lower(${batches.name}) LIKE ${term}`);
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const totalRow = db.select({ count: sql<number>`count(*)` }).from(batches).where(whereClause).get();
  const total = totalRow?.count ?? 0;

  const rows = db
    .select({
      id: batches.id,
      name: batches.name,
      type: batches.type,
      batchNumber: batches.batchNumber,
      status: batches.status,
      startDate: batches.startDate,
      endDate: batches.endDate,
      ownerId: batches.ownerId,
      recipeId: batches.recipeId,
      createdAt: batches.createdAt,
      ownerUsername: users.username,
      ownerDisplayName: users.displayName,
    })
    .from(batches)
    .leftJoin(users, eq(users.id, batches.ownerId))
    .where(whereClause)
    .orderBy(desc(batches.startDate), desc(batches.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all();

  res.json({ batches: rows, total, page, pageSize });
});

router.get('/:id', requireAuth, requireOwnerOrAdmin(loadBatchOwnerId), (req, res) => {
  const id = Number(req.params.id);
  const batch = db.select().from(batches).where(eq(batches.id, id)).get();
  if (!batch) {
    res.status(404).json({ error: 'Batch not found' });
    return;
  }

  const ingredients = db
    .select()
    .from(batchIngredients)
    .where(eq(batchIngredients.batchId, id))
    .orderBy(asc(batchIngredients.sortOrder))
    .all();
  const steps = db
    .select()
    .from(batchSteps)
    .where(eq(batchSteps.batchId, id))
    .orderBy(asc(batchSteps.stepNumber))
    .all();
  const owner = db
    .select({ id: users.id, username: users.username, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, batch.ownerId))
    .get();

  const logEntryRows = db
    .select({
      id: batchLogEntries.id,
      batchId: batchLogEntries.batchId,
      entryDate: batchLogEntries.entryDate,
      actionId: batchLogEntries.actionId,
      actionName: actions.name,
      og: batchLogEntries.og,
      fg: batchLogEntries.fg,
      brix: batchLogEntries.brix,
      sg: batchLogEntries.sg,
      ph: batchLogEntries.ph,
      temperature: batchLogEntries.temperature,
      temperatureUnit: batchLogEntries.temperatureUnit,
      notes: batchLogEntries.notes,
      createdBy: batchLogEntries.createdBy,
      createdAt: batchLogEntries.createdAt,
    })
    .from(batchLogEntries)
    .leftJoin(actions, eq(actions.id, batchLogEntries.actionId))
    .where(eq(batchLogEntries.batchId, id))
    .orderBy(desc(batchLogEntries.entryDate), desc(batchLogEntries.id))
    .all();

  const photoRows = logEntryRows.length
    ? db
        .select()
        .from(batchLogPhotos)
        .where(
          inArray(
            batchLogPhotos.logEntryId,
            logEntryRows.map((entry) => entry.id),
          ),
        )
        .all()
    : [];

  const logEntries = logEntryRows.map((entry) => ({
    ...entry,
    photos: photoRows.filter((photo) => photo.logEntryId === entry.id),
  }));

  res.json({ batch: { ...batch, owner: owner ?? null }, ingredients, steps, logEntries });
});

router.post('/', requireAuth, (req, res) => {
  const parsed = createBatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { recipeId, name, type, startDate, notes, ingredients, steps } = parsed.data;

  let sourceRecipe: typeof recipes.$inferSelect | undefined;
  let sourceIngredients: (typeof recipeIngredients.$inferSelect)[] = [];
  let sourceSteps: (typeof recipeSteps.$inferSelect)[] = [];

  if (recipeId) {
    sourceRecipe = db.select().from(recipes).where(eq(recipes.id, recipeId)).get();
    if (!sourceRecipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }
    sourceIngredients = db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipeId))
      .orderBy(asc(recipeIngredients.sortOrder))
      .all();
    sourceSteps = db
      .select()
      .from(recipeSteps)
      .where(eq(recipeSteps.recipeId, recipeId))
      .orderBy(asc(recipeSteps.stepNumber))
      .all();
  }

  const finalType = sourceRecipe ? sourceRecipe.type : type!;
  const finalIngredients = sourceRecipe
    ? sourceIngredients.map((ing) => ({
        category: ing.category,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        notes: ing.notes,
      }))
    : ingredients;
  const finalSteps = sourceRecipe ? sourceSteps.map((step) => ({ text: step.text })) : steps;

  const created = sqlite.transaction(() => {
    const batchNumber = generateBatchNumber();
    const batch = db
      .insert(batches)
      .values({
        recipeId: sourceRecipe?.id,
        recipeNameSnapshot: sourceRecipe?.name,
        type: finalType,
        name,
        batchNumber,
        status: 'planning',
        startDate,
        notes,
        ownerId: req.user!.id,
      })
      .returning()
      .get();

    if (finalIngredients.length) {
      db.insert(batchIngredients)
        .values(
          finalIngredients.map((ing, index) => ({
            batchId: batch.id,
            sortOrder: index,
            category: ing.category,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            notes: ing.notes,
          })),
        )
        .run();
    }
    if (finalSteps.length) {
      db.insert(batchSteps)
        .values(finalSteps.map((step, index) => ({ batchId: batch.id, stepNumber: index + 1, text: step.text })))
        .run();
    }
    return batch;
  })();

  res.status(201).json({ batch: created });
});

router.patch('/:id', requireAuth, requireOwnerOrAdmin(loadBatchOwnerId), (req, res) => {
  const id = Number(req.params.id);
  const parsed = updateBatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { ingredients, steps, ...batchFields } = parsed.data;

  const updated = sqlite.transaction(() => {
    const batch = db
      .update(batches)
      .set({ ...batchFields, updatedAt: now() })
      .where(eq(batches.id, id))
      .returning()
      .get();
    if (!batch) return null;

    db.delete(batchIngredients).where(eq(batchIngredients.batchId, id)).run();
    db.delete(batchSteps).where(eq(batchSteps.batchId, id)).run();

    if (ingredients.length) {
      db.insert(batchIngredients)
        .values(
          ingredients.map((ing, index) => ({
            batchId: id,
            sortOrder: index,
            category: ing.category,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            notes: ing.notes,
          })),
        )
        .run();
    }
    if (steps.length) {
      db.insert(batchSteps)
        .values(
          steps.map((step, index) => ({
            batchId: id,
            stepNumber: index + 1,
            text: step.text,
            isDone: step.isDone,
          })),
        )
        .run();
    }
    return batch;
  })();

  if (!updated) {
    res.status(404).json({ error: 'Batch not found' });
    return;
  }
  res.json({ batch: updated });
});

router.delete('/:id', requireAuth, requireOwnerOrAdmin(loadBatchOwnerId), (req, res) => {
  const id = Number(req.params.id);
  const batch = db.select({ id: batches.id }).from(batches).where(eq(batches.id, id)).get();
  if (!batch) {
    res.status(404).json({ error: 'Batch not found' });
    return;
  }

  // Gather uploaded photo paths before the cascade delete removes the DB rows referencing them.
  const photoRows = db
    .select({ filePath: batchLogPhotos.filePath })
    .from(batchLogPhotos)
    .innerJoin(batchLogEntries, eq(batchLogEntries.id, batchLogPhotos.logEntryId))
    .where(eq(batchLogEntries.batchId, id))
    .all();

  db.delete(batches).where(eq(batches.id, id)).run();
  photoRows.forEach((photo) => deleteUploadedFile(photo.filePath));

  res.json({ ok: true });
});

router.post('/:id/log-entries', requireAuth, requireOwnerOrAdmin(loadBatchOwnerId), (req, res) => {
  const id = Number(req.params.id);
  const parsed = batchLogEntryInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const created = db
    .insert(batchLogEntries)
    .values({ ...parsed.data, batchId: id, createdBy: req.user!.id })
    .returning()
    .get();
  res.status(201).json({ logEntry: created });
});

router.patch('/:id/log-entries/:entryId', requireAuth, requireOwnerOrAdmin(loadBatchOwnerId), (req, res) => {
  const batchId = Number(req.params.id);
  const entryId = Number(req.params.entryId);
  const parsed = batchLogEntryInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const updated = db
    .update(batchLogEntries)
    .set(parsed.data)
    .where(and(eq(batchLogEntries.id, entryId), eq(batchLogEntries.batchId, batchId)))
    .returning()
    .get();
  if (!updated) {
    res.status(404).json({ error: 'Log entry not found' });
    return;
  }
  res.json({ logEntry: updated });
});

router.delete('/:id/log-entries/:entryId', requireAuth, requireOwnerOrAdmin(loadBatchOwnerId), (req, res) => {
  const batchId = Number(req.params.id);
  const entryId = Number(req.params.entryId);

  const photoRows = db
    .select({ filePath: batchLogPhotos.filePath })
    .from(batchLogPhotos)
    .where(eq(batchLogPhotos.logEntryId, entryId))
    .all();

  const result = db
    .delete(batchLogEntries)
    .where(and(eq(batchLogEntries.id, entryId), eq(batchLogEntries.batchId, batchId)))
    .run();
  if (result.changes === 0) {
    res.status(404).json({ error: 'Log entry not found' });
    return;
  }

  photoRows.forEach((photo) => deleteUploadedFile(photo.filePath));
  res.json({ ok: true });
});

router.post(
  '/:id/log-entries/:entryId/photos',
  requireAuth,
  requireOwnerOrAdmin(loadBatchOwnerId),
  (req, res, next) => {
    uploadLogPhoto(req, res, (err: unknown) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid file upload' });
        return;
      }
      next();
    });
  },
  (req, res) => {
    const entryId = Number(req.params.entryId);
    if (!req.file) {
      res.status(400).json({ error: 'No photo file provided' });
      return;
    }
    const created = db
      .insert(batchLogPhotos)
      .values({
        logEntryId: entryId,
        filePath: `batch-logs/${req.file.filename}`,
        originalFilename: req.file.originalname,
      })
      .returning()
      .get();
    res.status(201).json({ photo: created });
  },
);

router.get(
  '/:id/log-entries/:entryId/photos/:photoId',
  requireAuth,
  requireOwnerOrAdmin(loadBatchOwnerId),
  (req, res) => {
    const photoId = Number(req.params.photoId);
    const photo = db.select({ filePath: batchLogPhotos.filePath }).from(batchLogPhotos).where(eq(batchLogPhotos.id, photoId)).get();
    if (!photo) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }
    res.sendFile(resolveUploadPath(photo.filePath));
  },
);

router.delete(
  '/:id/log-entries/:entryId/photos/:photoId',
  requireAuth,
  requireOwnerOrAdmin(loadBatchOwnerId),
  (req, res) => {
    const photoId = Number(req.params.photoId);
    const photo = db.select({ filePath: batchLogPhotos.filePath }).from(batchLogPhotos).where(eq(batchLogPhotos.id, photoId)).get();
    if (!photo) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }
    db.delete(batchLogPhotos).where(eq(batchLogPhotos.id, photoId)).run();
    deleteUploadedFile(photo.filePath);
    res.json({ ok: true });
  },
);

export default router;
