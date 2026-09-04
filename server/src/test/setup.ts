import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '../db/client.js';

// Runs once per test file against that file's isolated in-memory database.
migrate(db, { migrationsFolder: './drizzle' });
