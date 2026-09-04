import { changeOwnPasswordSchema, loginSchema, updateOwnProfileSchema } from '@brewlog/shared';
import { eq } from 'drizzle-orm';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { db } from '../db/client.js';
import { now } from '../db/now.js';
import { users } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

router.post('/login', loginLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid username or password' });
    return;
  }
  const { username, password } = parsed.data;

  // Same generic response for "no such user", "inactive", and "wrong password" - avoids user enumeration.
  const reject = () => res.status(401).json({ error: 'Invalid username or password' });

  const user = db.select().from(users).where(eq(users.username, username)).get();
  if (!user || !user.isActive) {
    reject();
    return;
  }

  verifyPassword(user.passwordHash, password)
    .then((valid) => {
      if (!valid) {
        reject();
        return;
      }

      req.session.regenerate((err) => {
        if (err) {
          res.status(500).json({ error: 'Login failed' });
          return;
        }
        req.session.userId = user.id;
        req.session.save((saveErr) => {
          if (saveErr) {
            res.status(500).json({ error: 'Login failed' });
            return;
          }
          res.json({
            user: {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              role: user.role,
            },
          });
        });
      });
    })
    .catch(() => reject());
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
    res.clearCookie('brewlog.sid');
    res.json({ ok: true });
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.patch('/me', requireAuth, (req, res) => {
  const parsed = updateOwnProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const updated = db
    .update(users)
    .set({ displayName: parsed.data.displayName, updatedAt: now() })
    .where(eq(users.id, req.user!.id))
    .returning()
    .get();

  res.json({
    user: {
      id: updated.id,
      username: updated.username,
      displayName: updated.displayName,
      role: updated.role,
    },
  });
});

router.post('/change-password', requireAuth, (req, res) => {
  const parsed = changeOwnPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const user = db.select().from(users).where(eq(users.id, req.user!.id)).get();
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  verifyPassword(user.passwordHash, parsed.data.currentPassword)
    .then((valid) => {
      if (!valid) {
        res.status(400).json({ error: 'Current password is incorrect' });
        return;
      }
      return hashPassword(parsed.data.newPassword).then((passwordHash) => {
        db.update(users)
          .set({ passwordHash, updatedAt: now() })
          .where(eq(users.id, user.id))
          .run();
        res.json({ ok: true });
      });
    })
    .catch(() => res.status(500).json({ error: 'Failed to change password' }));
});

export default router;
