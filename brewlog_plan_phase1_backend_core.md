# Phase 1 — Backend Core (Data + Auth)

Status: **not started**

## Goals
Stand up the database schema, session-based auth, and admin-managed lookup/user endpoints that every later
feature phase depends on.

## Tasks
- [ ] Drizzle schema for all tables (see data model in `brewlog_plan.md`) + migration setup.
- [ ] Seed script to create the first admin user from env vars.
- [ ] Session middleware (SQLite-backed store), argon2 password hashing.
- [ ] Auth endpoints: login, logout, current-user.
- [ ] Authorization middleware: `requireAuth`, `requireAdmin`, `requireOwnerOrAdmin`.
- [ ] CSRF protection on state-changing routes.
- [ ] Users CRUD endpoints (admin only): list, create, edit role/active, reset password.
- [ ] Actions CRUD endpoints (admin only): list, create, edit, deactivate, reorder.
- [ ] Rate limiting on the login endpoint.
- [ ] helmet + baseline security headers.

## Verification
- `curl` smoke tests: login sets a session cookie; protected routes reject unauthenticated requests (401);
  non-admin requests to admin routes are rejected (403).
- Automated tests (Vitest + supertest) covering auth middleware and CRUD ownership rules.
