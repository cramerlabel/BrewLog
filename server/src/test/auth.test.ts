import { beforeAll, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../app.js';
import { createUser, getCsrfToken, loginAs } from './helpers.js';

describe('auth & authorization middleware', () => {
  let app: Express;

  beforeAll(async () => {
    app = createApp();
    await createUser({ username: 'alice', password: 'alice-password-123', role: 'user' });
    await createUser({ username: 'bob-admin', password: 'bob-password-123', role: 'admin' });
    await createUser({
      username: 'inactive-carl',
      password: 'carl-password-123',
      role: 'user',
      isActive: false,
    });
  });

  it('rejects login with a wrong password with a generic message', async () => {
    const agent = request.agent(app);
    const token = await getCsrfToken(agent);
    const res = await agent
      .post('/api/auth/login')
      .set('x-csrf-token', token)
      .send({ username: 'alice', password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid username or password');
  });

  it('rejects login for an inactive user with the same generic message', async () => {
    const agent = request.agent(app);
    const token = await getCsrfToken(agent);
    const res = await agent
      .post('/api/auth/login')
      .set('x-csrf-token', token)
      .send({ username: 'inactive-carl', password: 'carl-password-123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid username or password');
  });

  it('logs in successfully with correct credentials and sets a session cookie', async () => {
    const { agent } = await loginAs(app, 'alice', 'alice-password-123');
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.username).toBe('alice');
  });

  it('requireAuth blocks unauthenticated requests', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('requireAdmin blocks a non-admin from the admin-only users list', async () => {
    const { agent } = await loginAs(app, 'alice', 'alice-password-123');
    const res = await agent.get('/api/users');
    expect(res.status).toBe(403);
  });

  it('requireAdmin allows an admin to reach the users list', async () => {
    const { agent } = await loginAs(app, 'bob-admin', 'bob-password-123');
    const res = await agent.get('/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('rejects a mutating request with no CSRF header at all', async () => {
    const { agent } = await loginAs(app, 'alice', 'alice-password-123');
    const res = await agent.patch('/api/auth/me').send({ displayName: 'Alice Updated' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/csrf/i);
  });

  it('rejects a mutating request with a CSRF header that does not match the cookie', async () => {
    const { agent } = await loginAs(app, 'alice', 'alice-password-123');
    const res = await agent
      .patch('/api/auth/me')
      .set('x-csrf-token', 'not-the-real-token')
      .send({ displayName: 'Alice Updated' });
    expect(res.status).toBe(403);
  });

  it('accepts a mutating request with a matching CSRF header', async () => {
    const { agent, csrfToken } = await loginAs(app, 'alice', 'alice-password-123');
    const res = await agent
      .patch('/api/auth/me')
      .set('x-csrf-token', csrfToken)
      .send({ displayName: 'Alice Updated' });
    expect(res.status).toBe(200);
    expect(res.body.user.displayName).toBe('Alice Updated');
  });
});
