import type Database from 'better-sqlite3';
import session from 'express-session';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

interface SessionRow {
  sess: string;
  expires_at: number;
}

function expiresAtFor(sessionData: session.SessionData): number {
  const expires = sessionData.cookie?.expires;
  return expires ? new Date(expires).getTime() : Date.now() + DEFAULT_TTL_MS;
}

// SQLite-backed express-session store, matching the `sessions` table in the Drizzle schema.
export class SqliteSessionStore extends session.Store {
  constructor(private readonly db: Database.Database) {
    super();
  }

  get(sid: string, callback: (err: unknown, session?: session.SessionData | null) => void): void {
    try {
      const row = this.db
        .prepare('SELECT sess, expires_at FROM sessions WHERE sid = ?')
        .get(sid) as SessionRow | undefined;
      if (!row) return callback(null, null);
      if (row.expires_at < Date.now()) {
        this.db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
        return callback(null, null);
      }
      callback(null, JSON.parse(row.sess));
    } catch (err) {
      callback(err);
    }
  }

  set(sid: string, sessionData: session.SessionData, callback?: (err?: unknown) => void): void {
    try {
      const userId = (sessionData as session.SessionData & { userId?: number }).userId ?? null;
      this.db
        .prepare(
          `INSERT INTO sessions (sid, user_id, sess, expires_at) VALUES (?, ?, ?, ?)
           ON CONFLICT(sid) DO UPDATE SET user_id = excluded.user_id, sess = excluded.sess, expires_at = excluded.expires_at`,
        )
        .run(sid, userId, JSON.stringify(sessionData), expiresAtFor(sessionData));
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  destroy(sid: string, callback?: (err?: unknown) => void): void {
    try {
      this.db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  touch(sid: string, sessionData: session.SessionData, callback?: (err?: unknown) => void): void {
    try {
      this.db
        .prepare('UPDATE sessions SET expires_at = ? WHERE sid = ?')
        .run(expiresAtFor(sessionData), sid);
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }
}

export function pruneExpiredSessions(db: Database.Database): void {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
}
