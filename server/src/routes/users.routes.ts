import { adminResetPasswordSchema, createUserSchema, updateUserSchema } from '@brewlog/shared';
import { eq } from 'drizzle-orm';
import { Router } from 'express';
import { hashPassword } from '../auth/password.js';
import { db } from '../db/client.js';
import { now } from '../db/now.js';
import { users } from '../db/schema.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

function toPublicUser(user: typeof users.$inferSelect) {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

router.get('/', (_req, res) => {
  const all = db.select().from(users).all();
  res.json({ users: all.map(toPublicUser) });
});

router.post('/', (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { username, displayName, email, role, password } = parsed.data;

  const existing = db.select().from(users).where(eq(users.username, username)).get();
  if (existing) {
    res.status(409).json({ error: 'Username already taken' });
    return;
  }

  hashPassword(password)
    .then((passwordHash) => {
      const created = db
        .insert(users)
        .values({ username, displayName, email, role, passwordHash })
        .returning()
        .get();
      res.status(201).json({ user: toPublicUser(created) });
    })
    .catch(() => res.status(500).json({ error: 'Failed to create user' }));
});

router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid user id' });
    return;
  }

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  // Prevent an admin from locking themselves out by demoting/deactivating their own account.
  if (id === req.user!.id && (parsed.data.role === 'user' || parsed.data.isActive === false)) {
    res.status(400).json({ error: 'Cannot change your own role or active status' });
    return;
  }

  const updated = db
    .update(users)
    .set({ ...parsed.data, updatedAt: now() })
    .where(eq(users.id, id))
    .returning()
    .get();

  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: toPublicUser(updated) });
});

router.post('/:id/reset-password', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid user id' });
    return;
  }

  const parsed = adminResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  hashPassword(parsed.data.newPassword)
    .then((passwordHash) => {
      const updated = db
        .update(users)
        .set({ passwordHash, updatedAt: now() })
        .where(eq(users.id, id))
        .returning()
        .get();
      if (!updated) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json({ ok: true });
    })
    .catch(() => res.status(500).json({ error: 'Failed to reset password' }));
});

export default router;
