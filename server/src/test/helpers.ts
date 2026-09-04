import type { Express } from 'express';
import request from 'supertest';
import { hashPassword } from '../auth/password.js';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';

export type TestAgent = ReturnType<typeof request.agent>;

let usernameCounter = 0;

export async function createUser(overrides: {
  username?: string;
  password?: string;
  displayName?: string;
  role?: 'admin' | 'user';
  isActive?: boolean;
} = {}) {
  usernameCounter += 1;
  const username = overrides.username ?? `testuser${usernameCounter}`;
  const password = overrides.password ?? 'correct-horse-battery-staple';
  const passwordHash = await hashPassword(password);

  const created = db
    .insert(users)
    .values({
      username,
      displayName: overrides.displayName ?? username,
      role: overrides.role ?? 'user',
      isActive: overrides.isActive ?? true,
      passwordHash,
    })
    .returning()
    .get();

  return { ...created, password };
}

// Primes the double-submit CSRF cookie on the agent's jar and returns its value.
export async function getCsrfToken(agent: TestAgent): Promise<string> {
  const res = await agent.get('/api/health');
  const setCookie = (res.headers['set-cookie'] as string[] | undefined) ?? [];
  const cookie = setCookie.find((c) => c.startsWith('csrf_token='));
  if (!cookie) throw new Error('csrf_token cookie was not set by the server');
  return cookie.split(';')[0].split('=')[1];
}

// Logs in as the given user and returns an agent (persists the session cookie) plus the CSRF
// token to echo back in the `x-csrf-token` header on any subsequent mutating request.
export async function loginAs(
  app: Express,
  username: string,
  password: string,
): Promise<{ agent: TestAgent; csrfToken: string }> {
  const agent = request.agent(app);
  const csrfToken = await getCsrfToken(agent);
  await agent.post('/api/auth/login').set('x-csrf-token', csrfToken).send({ username, password }).expect(200);
  return { agent, csrfToken };
}
