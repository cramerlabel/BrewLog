import { beforeAll, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { createApp } from '../app.js';
import { createUser, loginAs, type TestAgent } from './helpers.js';

describe('batches: private-per-owner authorization rules', () => {
  let app: Express;
  let ownerAgent: TestAgent;
  let ownerCsrf: string;
  let otherAgent: TestAgent;
  let otherCsrf: string;
  let adminAgent: TestAgent;
  let adminCsrf: string;
  let batchId: number;

  beforeAll(async () => {
    app = createApp();
    await createUser({ username: 'owner', password: 'owner-password-123', role: 'user' });
    await createUser({ username: 'other', password: 'other-password-123', role: 'user' });
    await createUser({ username: 'admin', password: 'admin-password-123', role: 'admin' });

    ({ agent: ownerAgent, csrfToken: ownerCsrf } = await loginAs(app, 'owner', 'owner-password-123'));
    ({ agent: otherAgent, csrfToken: otherCsrf } = await loginAs(app, 'other', 'other-password-123'));
    ({ agent: adminAgent, csrfToken: adminCsrf } = await loginAs(app, 'admin', 'admin-password-123'));

    const created = await ownerAgent
      .post('/api/batches')
      .set('x-csrf-token', ownerCsrf)
      .send({
        name: 'Owner Batch',
        type: 'beer',
        startDate: '2026-01-01',
        ingredients: [],
        steps: [],
      });
    expect(created.status).toBe(201);
    batchId = created.body.batch.id;
  });

  it("excludes other users' batches from the list, scoped server-side by owner", async () => {
    const res = await otherAgent.get('/api/batches');
    expect(res.status).toBe(200);
    expect(res.body.batches).toHaveLength(0);
  });

  it("includes the batch in the owner's own list", async () => {
    const res = await ownerAgent.get('/api/batches');
    expect(res.status).toBe(200);
    expect(res.body.batches.map((b: { id: number }) => b.id)).toContain(batchId);
  });

  it('lets an admin see batches belonging to any user', async () => {
    const res = await adminAgent.get('/api/batches?status=all');
    expect(res.status).toBe(200);
    expect(res.body.batches.map((b: { id: number }) => b.id)).toContain(batchId);
  });

  it('blocks a non-owner, non-admin from viewing the batch detail (403, not a leaked 404)', async () => {
    const res = await otherAgent.get(`/api/batches/${batchId}`);
    expect(res.status).toBe(403);
  });

  it('allows the owner to view their own batch detail', async () => {
    const res = await ownerAgent.get(`/api/batches/${batchId}`);
    expect(res.status).toBe(200);
    expect(res.body.batch.id).toBe(batchId);
  });

  it('allows an admin to view a batch they do not own', async () => {
    const res = await adminAgent.get(`/api/batches/${batchId}`);
    expect(res.status).toBe(200);
  });

  it('blocks a non-owner, non-admin from editing the batch', async () => {
    const res = await otherAgent
      .patch(`/api/batches/${batchId}`)
      .set('x-csrf-token', otherCsrf)
      .send({
        name: 'Hijacked',
        type: 'beer',
        status: 'planning',
        startDate: '2026-01-01',
        ingredients: [],
        steps: [],
      });
    expect(res.status).toBe(403);
  });

  it('blocks a non-owner, non-admin from adding a log entry', async () => {
    const res = await otherAgent
      .post(`/api/batches/${batchId}/log-entries`)
      .set('x-csrf-token', otherCsrf)
      .send({ entryDate: '2026-01-02' });
    expect(res.status).toBe(403);
  });

  it('allows the owner to add a log entry', async () => {
    const res = await ownerAgent
      .post(`/api/batches/${batchId}/log-entries`)
      .set('x-csrf-token', ownerCsrf)
      .send({ entryDate: '2026-01-02' });
    expect(res.status).toBe(201);
  });

  it('blocks a non-owner, non-admin from deleting the batch', async () => {
    const res = await otherAgent.delete(`/api/batches/${batchId}`).set('x-csrf-token', otherCsrf);
    expect(res.status).toBe(403);
  });

  it('allows an admin to delete a batch they do not own', async () => {
    const res = await adminAgent.delete(`/api/batches/${batchId}`).set('x-csrf-token', adminCsrf);
    expect(res.status).toBe(200);

    const followUp = await ownerAgent.get(`/api/batches/${batchId}`);
    expect(followUp.status).toBe(404);
  });
});
