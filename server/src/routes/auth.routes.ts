import { loginSchema } from '@brewlog/shared';
import { eq } from 'drizzle-orm';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyPassword } from '../auth/password.js';
import { db } from '../db/client.js';
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

export default router;
