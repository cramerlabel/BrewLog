import { eq } from 'drizzle-orm';
import { hashPassword } from '../auth/password.js';
import { env } from '../env.js';
import { db, sqlite } from './client.js';
import { users } from './schema.js';

async function seed() {
  const existingAdmin = db.select().from(users).where(eq(users.role, 'admin')).get();
  if (existingAdmin) {
    console.log('An admin user already exists - skipping seed.');
    return;
  }

  if (!env.SEED_ADMIN_USERNAME || !env.SEED_ADMIN_PASSWORD) {
    throw new Error(
      'SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD must be set in the environment to seed the first admin user.',
    );
  }

  const passwordHash = await hashPassword(env.SEED_ADMIN_PASSWORD);
  db.insert(users)
    .values({
      username: env.SEED_ADMIN_USERNAME,
      displayName: env.SEED_ADMIN_USERNAME,
      role: 'admin',
      passwordHash,
    })
    .run();

  console.log(`Admin user "${env.SEED_ADMIN_USERNAME}" created.`);
}

seed()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sqlite.close());
