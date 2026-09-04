import { beforeAll, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { createApp } from '../app.js';
import { createUser, loginAs, type TestAgent } from './helpers.js';

describe('recipes: authorization & ownership rules', () => {
  let app: Express;
  let ownerAgent: TestAgent;
  let ownerCsrf: string;
  let otherAgent: TestAgent;
  let otherCsrf: string;
  let adminAgent: TestAgent;
  let adminCsrf: string;
  let recipeId: number;

  beforeAll(async () => {
    app = createApp();
    await createUser({ username: 'owner', password: 'owner-password-123', role: 'user' });
    await createUser({ username: 'other', password: 'other-password-123', role: 'user' });
    await createUser({ username: 'admin', password: 'admin-password-123', role: 'admin' });

    ({ agent: ownerAgent, csrfToken: ownerCsrf } = await loginAs(app, 'owner', 'owner-password-123'));
    ({ agent: otherAgent, csrfToken: otherCsrf } = await loginAs(app, 'other', 'other-password-123'));
    ({ agent: adminAgent, csrfToken: adminCsrf } = await loginAs(app, 'admin', 'admin-password-123'));

    const created = await ownerAgent
      .post('/api/recipes')
      .set('x-csrf-token', ownerCsrf)
      .send({ name: 'Owner IPA', type: 'beer', ingredients: [], steps: [] });
    expect(created.status).toBe(201);
    recipeId = created.body.recipe.id;
  });

  it('is viewable by any authenticated user, not just the owner', async () => {
    const res = await otherAgent.get(`/api/recipes/${recipeId}`);
    expect(res.status).toBe(200);
    expect(res.body.recipe.name).toBe('Owner IPA');
  });

  it('blocks a non-owner, non-admin from editing the recipe', async () => {
    const res = await otherAgent
      .patch(`/api/recipes/${recipeId}`)
      .set('x-csrf-token', otherCsrf)
      .send({ name: 'Hijacked name', type: 'beer', ingredients: [], steps: [] });
    expect(res.status).toBe(403);
  });

  it('blocks a non-owner, non-admin from deleting the recipe', async () => {
    const res = await otherAgent.delete(`/api/recipes/${recipeId}`).set('x-csrf-token', otherCsrf);
    expect(res.status).toBe(403);
  });

  it('allows the owner to edit their own recipe', async () => {
    const res = await ownerAgent
      .patch(`/api/recipes/${recipeId}`)
      .set('x-csrf-token', ownerCsrf)
      .send({ name: 'Owner IPA v2', type: 'beer', ingredients: [], steps: [] });
    expect(res.status).toBe(200);
    expect(res.body.recipe.name).toBe('Owner IPA v2');
  });

  it('allows an admin to edit a recipe they do not own', async () => {
    const res = await adminAgent
      .patch(`/api/recipes/${recipeId}`)
      .set('x-csrf-token', adminCsrf)
      .send({ name: 'Admin-edited IPA', type: 'beer', ingredients: [], steps: [] });
    expect(res.status).toBe(200);
    expect(res.body.recipe.name).toBe('Admin-edited IPA');
  });

  it('allows an admin to delete a recipe they do not own', async () => {
    const res = await adminAgent.delete(`/api/recipes/${recipeId}`).set('x-csrf-token', adminCsrf);
    expect(res.status).toBe(200);

    const followUp = await ownerAgent.get(`/api/recipes/${recipeId}`);
    expect(followUp.status).toBe(404);
  });
});
