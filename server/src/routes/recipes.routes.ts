import { recipeInputSchema } from '@brewlog/shared';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { Router, type Request } from 'express';
import { db, sqlite } from '../db/client.js';
import { now } from '../db/now.js';
import { recipeIngredients, recipes, recipeSteps, users } from '../db/schema.js';
import { requireAuth, requireOwnerOrAdmin } from '../middleware/auth.js';
import { createImageUpload, deleteUploadedFile, resolveUploadPath } from '../uploads/image-upload.js';

const router = Router();
const uploadRecipePhoto = createImageUpload('recipes');

function loadRecipeOwnerId(req: Request): number | null {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return null;
  const recipe = db.select({ createdBy: recipes.createdBy }).from(recipes).where(eq(recipes.id, id)).get();
  return recipe ? recipe.createdBy : null;
}

router.get('/', requireAuth, (req, res) => {
  const { type, search, createdBy } = req.query;
  const conditions = [];

  if (type === 'beer' || type === 'wine') {
    conditions.push(eq(recipes.type, type));
  }
  const createdByNum = Number(createdBy);
  if (typeof createdBy === 'string' && Number.isInteger(createdByNum)) {
    conditions.push(eq(recipes.createdBy, createdByNum));
  }
  if (typeof search === 'string' && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    conditions.push(
      sql`(lower(${recipes.name}) LIKE ${term} OR lower(coalesce(${recipes.style}, '')) LIKE ${term})`,
    );
  }

  const rows = db
    .select({
      id: recipes.id,
      name: recipes.name,
      type: recipes.type,
      style: recipes.style,
      photoPath: recipes.photoPath,
      createdBy: recipes.createdBy,
      createdAt: recipes.createdAt,
      creatorUsername: users.username,
      creatorDisplayName: users.displayName,
    })
    .from(recipes)
    .leftJoin(users, eq(users.id, recipes.createdBy))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(recipes.createdAt))
    .all();

  res.json({ recipes: rows });
});

router.get('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid recipe id' });
    return;
  }

  const recipe = db.select().from(recipes).where(eq(recipes.id, id)).get();
  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }

  const ingredients = db
    .select()
    .from(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, id))
    .orderBy(asc(recipeIngredients.sortOrder))
    .all();
  const steps = db
    .select()
    .from(recipeSteps)
    .where(eq(recipeSteps.recipeId, id))
    .orderBy(asc(recipeSteps.stepNumber))
    .all();
  const creator = db
    .select({ id: users.id, username: users.username, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, recipe.createdBy))
    .get();

  res.json({ recipe: { ...recipe, creator: creator ?? null }, ingredients, steps });
});

router.post('/', requireAuth, (req, res) => {
  const parsed = recipeInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { ingredients, steps, ...recipeFields } = parsed.data;

  const created = sqlite.transaction(() => {
    const recipe = db
      .insert(recipes)
      .values({ ...recipeFields, createdBy: req.user!.id })
      .returning()
      .get();

    if (ingredients.length) {
      db.insert(recipeIngredients)
        .values(
          ingredients.map((ing, index) => ({
            recipeId: recipe.id,
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
      db.insert(recipeSteps)
        .values(steps.map((step, index) => ({ recipeId: recipe.id, stepNumber: index + 1, text: step.text })))
        .run();
    }
    return recipe;
  })();

  res.status(201).json({ recipe: created });
});

router.patch('/:id', requireAuth, requireOwnerOrAdmin(loadRecipeOwnerId), (req, res) => {
  const id = Number(req.params.id);
  const parsed = recipeInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { ingredients, steps, ...recipeFields } = parsed.data;

  const updated = sqlite.transaction(() => {
    const recipe = db
      .update(recipes)
      .set({ ...recipeFields, updatedAt: now() })
      .where(eq(recipes.id, id))
      .returning()
      .get();
    if (!recipe) return null;

    db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id)).run();
    db.delete(recipeSteps).where(eq(recipeSteps.recipeId, id)).run();

    if (ingredients.length) {
      db.insert(recipeIngredients)
        .values(
          ingredients.map((ing, index) => ({
            recipeId: id,
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
      db.insert(recipeSteps)
        .values(steps.map((step, index) => ({ recipeId: id, stepNumber: index + 1, text: step.text })))
        .run();
    }
    return recipe;
  })();

  if (!updated) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }
  res.json({ recipe: updated });
});

router.delete('/:id', requireAuth, requireOwnerOrAdmin(loadRecipeOwnerId), (req, res) => {
  const id = Number(req.params.id);
  const recipe = db.select({ photoPath: recipes.photoPath }).from(recipes).where(eq(recipes.id, id)).get();
  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }
  db.delete(recipes).where(eq(recipes.id, id)).run(); // ingredients/steps cascade via FK
  deleteUploadedFile(recipe.photoPath);
  res.json({ ok: true });
});

router.get('/:id/photo', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid recipe id' });
    return;
  }
  const recipe = db.select({ photoPath: recipes.photoPath }).from(recipes).where(eq(recipes.id, id)).get();
  if (!recipe?.photoPath) {
    res.status(404).json({ error: 'Photo not found' });
    return;
  }
  res.sendFile(resolveUploadPath(recipe.photoPath));
});

router.post('/:id/photo', requireAuth, requireOwnerOrAdmin(loadRecipeOwnerId), (req, res, next) => {
  uploadRecipePhoto(req, res, (err: unknown) => {
    if (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid file upload' });
      return;
    }
    next();
  });
}, (req, res) => {
  const id = Number(req.params.id);
  if (!req.file) {
    res.status(400).json({ error: 'No photo file provided' });
    return;
  }

  const relativePath = `recipes/${req.file.filename}`;
  const existing = db.select({ photoPath: recipes.photoPath }).from(recipes).where(eq(recipes.id, id)).get();
  const updated = db
    .update(recipes)
    .set({ photoPath: relativePath, updatedAt: now() })
    .where(eq(recipes.id, id))
    .returning()
    .get();

  if (existing?.photoPath && existing.photoPath !== relativePath) {
    deleteUploadedFile(existing.photoPath);
  }
  res.json({ recipe: updated });
});

router.delete('/:id/photo', requireAuth, requireOwnerOrAdmin(loadRecipeOwnerId), (req, res) => {
  const id = Number(req.params.id);
  const recipe = db.select({ photoPath: recipes.photoPath }).from(recipes).where(eq(recipes.id, id)).get();
  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }
  deleteUploadedFile(recipe.photoPath);
  const updated = db
    .update(recipes)
    .set({ photoPath: null, updatedAt: now() })
    .where(eq(recipes.id, id))
    .returning()
    .get();
  res.json({ recipe: updated });
});

export default router;
