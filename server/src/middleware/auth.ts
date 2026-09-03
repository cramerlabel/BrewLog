import { eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user || !user.isActive) {
    req.session.destroy(() => {});
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  req.user = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

// Grants access if the current user owns the resource (per loadOwnerId) or is an admin.
export function requireOwnerOrAdmin(loadOwnerId: (req: Request) => Promise<number | null> | number | null) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (req.user.role === 'admin') {
      next();
      return;
    }
    const ownerId = await loadOwnerId(req);
    if (ownerId === null) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (ownerId !== req.user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
