import cookieParser from 'cookie-parser';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import { pruneExpiredSessions, SqliteSessionStore } from './auth/session-store.js';
import { sqlite } from './db/client.js';
import { env } from './env.js';
import { csrfProtection } from './middleware/csrf.js';
import actionsRoutes from './routes/actions.routes.js';
import authRoutes from './routes/auth.routes.js';
import recipesRoutes from './routes/recipes.routes.js';
import usersRoutes from './routes/users.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // running behind nginx as a reverse proxy
  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());

  pruneExpiredSessions(sqlite);

  app.use(
    session({
      name: 'brewlog.sid',
      store: new SqliteSessionStore(sqlite),
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      },
    }),
  );

  app.use(csrfProtection);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/actions', actionsRoutes);
  app.use('/api/recipes', recipesRoutes);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
