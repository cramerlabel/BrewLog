import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './client.js';

migrate(db, { migrationsFolder: './drizzle' });
sqlite.close();
console.log('Migrations applied.');
