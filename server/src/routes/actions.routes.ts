import { createActionSchema, updateActionSchema } from '@brewlog/shared';
import { eq } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '../db/client.js';
import { actions } from '../db/schema.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

// Every authenticated user can read the list (needed for the log-entry action picker).
router.get('/', requireAuth, (_req, res) => {
  const all = db.select().from(actions).all();
  res.json({ actions: all });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const parsed = createActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const existing = db.select().from(actions).where(eq(actions.name, parsed.data.name)).get();
  if (existing) {
    res.status(409).json({ error: 'An action with that name already exists' });
    return;
  }

  const created = db.insert(actions).values(parsed.data).returning().get();
  res.status(201).json({ action: created });
});

router.patch('/:id', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid action id' });
    return;
  }

  const parsed = updateActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const updated = db.update(actions).set(parsed.data).where(eq(actions.id, id)).returning().get();
  if (!updated) {
    res.status(404).json({ error: 'Action not found' });
    return;
  }
  res.json({ action: updated });
});

export default router;
