# Phase 1 — Backend Core (Data + Auth)

Status: **complete**

## Goals
Stand up the database schema, session-based auth, and admin-managed lookup/user endpoints that every later
feature phase depends on.

## Tasks
- [x] Drizzle schema for all tables (see data model in `brewlog_plan.md`) + migration setup.
- [x] Seed script to create the first admin user from env vars.
- [x] Session middleware (SQLite-backed store), argon2 password hashing.
- [x] Auth endpoints: login, logout, current-user.
- [x] Authorization middleware: `requireAuth`, `requireAdmin`, `requireOwnerOrAdmin`.
- [x] CSRF protection on state-changing routes.
- [x] Users CRUD endpoints (admin only): list, create, edit role/active, reset password.
- [x] Actions CRUD endpoints (admin only): list, create, edit, deactivate, reorder.
- [x] Rate limiting on the login endpoint.
- [x] helmet + baseline security headers.

## Verification
- `curl` smoke tests: login sets a session cookie; protected routes reject unauthenticated requests (401);
  non-admin requests to admin routes are rejected (403). **Done manually — all passed.**
- Automated tests (Vitest + supertest) covering auth middleware and CRUD ownership rules. **Deferred to
  Phase 6, which explicitly covers backend test coverage.**
