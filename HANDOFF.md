# Project State — BrewLog

## Project summary
BrewLog is a multi-user web app for managing and tracking homemade beer/wine recipes and batches.
Recipes are viewable by all authenticated users but editable only by their creator or an admin.
Batches are private — visible/editable only by their owner or an admin. Self-hosted on a single Linux
server behind nginx; auth, sessions, and file storage are all local (no external services).

## Current phase
Phases 0–4 complete (foundation, backend auth core, frontend shell, recipes, batches/summary).
Next phase: **Phase 5 — Settings / Admin** (user management + Actions-list management UI).

## Completed
- **Phase 0**: npm-workspaces monorepo (`client`/`server`/`shared`), ESLint+Prettier, `.gitignore`, GitHub
  repo pushed.
- **Phase 1**: Full Drizzle/SQLite schema (all 11 tables), session auth (argon2 + custom SQLite session
  store), CSRF (double-submit cookie), `requireAuth`/`requireAdmin`/`requireOwnerOrAdmin` middleware,
  login/logout/me + self-service profile/password endpoints, admin Users CRUD, Actions CRUD (read-all,
  admin-write), rate-limited login, seed script for first admin.
- **Phase 2**: Tailwind v4 + shadcn/ui (`new-york`), React Router app shell, `AuthContext`
  (`['auth','me']` query), route guards, Account menu, typed `fetch` API client with CSRF header injection.
- **Phase 3**: Recipes CRUD (ingredients/steps, full-replace on edit), optional recipe photo (multer,
  authenticated serve route), list/detail/new/edit pages, owner-or-admin edit enforcement.
- **Phase 4**: Batches CRUD (snapshot-copy from a recipe *or* blank), batch_number generator
  (`YYYY-NNN`), log entries (measurements + action + notes + multi-photo), Summary page (paginated,
  default "open batches" sorted by start date desc, status/type/search filters), batch detail page
  (editable ingredients/steps with per-step done tracking, status/yield editing, log timeline).
  Batches are private end-to-end (list/detail/photos all owner-or-admin gated server-side).
- All phases verified via curl (auth/ownership edge cases) **and** live browser testing (login flows,
  CRUD, privacy checks, filters).

## Not completed
- **Phase 5**: Settings page is still a placeholder (`client/src/pages/SettingsPage.tsx`). No UI yet for
  admin user management (create/edit role/activate/reset password) or Actions-list management
  (add/edit/deactivate/reorder). Backend APIs for both already exist (Phase 1) and just need a frontend.
- **Phase 6**: No responsive/accessibility pass, no empty/loading/error-state audit, no production nginx
  config or systemd unit, no automated tests (Vitest+supertest) yet.
- **Phase 7**: Cellar Inventory — planning only, not built (disabled nav placeholder already in AppShell).
- Minor known issue: a benign console 404 can appear briefly after deleting a recipe/batch (a
  React Query background refetch of the just-invalidated detail query racing the navigation away) —
  cosmetic only, not a functional bug.
- Client bundle exceeds Vite's 500kB warning threshold — deferred to Phase 6 (code-splitting).

## Architecture
- **Frontend**: React 18 + TypeScript + Vite, shadcn/ui (Radix + Tailwind v4), React Router v6, TanStack
  Query, React Hook Form + Zod (via `@hookform/resolvers`).
- **Backend**: Node.js + Express + TypeScript, Drizzle ORM + better-sqlite3, argon2 password hashing,
  express-session with a custom SQLite-backed store, multer for uploads, express-rate-limit.
- **Shared**: `@brewlog/shared` npm workspace — Zod schemas + inferred types imported by both
  client and server (single source of truth for validation/types).
- **Auth model**: httpOnly/secure/sameSite session cookie + double-submit CSRF cookie
  (`x-csrf-token` header on all mutating requests). Roles: `admin` | `user`. Admin-only account
  creation (no public self-signup).
- **Dev proxy**: Vite dev server proxies `/api` → `http://localhost:4000` so cookies behave identically
  in dev and prod (both same-origin from the browser's perspective; prod is nginx reverse-proxying to the
  same Node process).
- **Deployment target** (not yet built — Phase 6): nginx serves the built client + reverse-proxies `/api`;
  Node API runs via systemd. No Docker.

## Important files
- `brewlog_plan.md` — master plan: full data model, authorization rules, security notes, phase index.
- `brewlog_plan_phase5_settings_admin.md` — exact scope/tasks/verification for the next phase.
- `server/src/db/schema.ts` — Drizzle schema for all tables (source of truth for data model).
- `server/src/middleware/auth.ts` — `requireAuth`, `requireAdmin`, `requireOwnerOrAdmin` (reuse pattern
  for Phase 5's admin-only routes/pages).
- `server/src/routes/users.routes.ts` and `server/src/routes/actions.routes.ts` — backend already done for
  Phase 5; frontend just needs to consume these.
- `client/src/pages/SettingsPage.tsx` — current placeholder to replace.
- `client/src/features/recipes/` and `client/src/features/batches/` — reference implementations of the
  `{types,api,hooks}` + form pattern to replicate for a new `features/users/` and `features/actions/`
  (actions read-only hook already exists at `client/src/features/actions/hooks.ts` — extend, don't
  duplicate).
- `client/src/auth/route-guards.tsx` — `RequireAdmin` already wraps the `/settings` route in `App.tsx`.

## Conventions
- Every package has its own `eslint.config.js`; `@typescript-eslint/no-unused-vars` ignores `^_`-prefixed
  args/vars — copy this pattern into any new package config.
- All Zod input schemas live in `/shared`, never duplicated in client or server.
- react-hook-form + zodResolver: when a schema has `.default([])`/refinements, use
  `useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>()` (see any of the `*Form.tsx`
  files) — a plain `useForm<Schema>()` will fail to type-check.
- Server timestamps: always use the shared `now()` helper (`server/src/db/now.ts`,
  `sql\`(current_timestamp)\``) for `updatedAt`, never `new Date().toISOString()` — mixing formats breaks
  lexicographic sorting of TEXT columns.
- File uploads: use `createImageUpload(subdir)` from `server/src/uploads/image-upload.ts` (randomized
  filenames, mime/size validated) — never write a new multer config from scratch.
- Photos are always served through an authenticated Express route, never a public nginx static path.
- Full-replace pattern for child rows (ingredients/steps) on every edit — delete + reinsert inside a
  `sqlite.transaction()`, not diffed.
- Ownership checks: `requireOwnerOrAdmin(loadOwnerId)` middleware factory — write a small
  `loadXOwnerId(req)` for any new owned resource rather than inlining checks in route handlers.
- Commit messages follow `Phase N: <summary>`; each phase's `brewlog_plan_phaseN_*.md` file is updated
  (checkboxes + a short verification/notes section) as part of that phase's commit.
- Repo-scoped conventions and gotchas (shadcn CLI alias quirk, RHF/zod generic fix, etc.) are also saved in
  local Claude/Copilot memory at `/memories/repo/conventions.md` if the next session's tool has access to
  it; this handoff file is the portable, tool-agnostic version.

## Known issues
- See "Not completed" above (cosmetic delete-refetch 404, bundle size warning) — nothing blocking.
- Dev-only transitive vulnerability in esbuild via vitest/drizzle-kit (dev server only, not shipped);
  accepted risk, would require a vitest 5 major bump to fully clear.

## Next session should read first
1. `brewlog_plan_phase5_settings_admin.md` — exact scope for this phase.
2. `brewlog_plan.md` — data model + authorization rules (Users/Actions sections).
3. `server/src/routes/users.routes.ts` and `server/src/routes/actions.routes.ts` — existing backend APIs
   to wire up.
4. `client/src/features/recipes/` (or `batches/`) — the `{types,api,hooks}` + page pattern to replicate.
5. `client/src/pages/SettingsPage.tsx` and `client/src/App.tsx` — where the new UI plugs in.

## Next phase goal
Implement Phase 5 — Settings / Admin UI (backend already complete):
- `features/users/` (types, api, hooks) consuming the existing admin Users endpoints.
- `features/actions/` — extend the existing read hook with admin create/update (deactivate/reorder).
- Settings page with two tabs: **Users** (list, create, edit role/active, reset password) and
  **Actions** (list, create, edit, deactivate/reorder, `applicableTo` field).
- Confirm `RequireAdmin` guard already covers `/settings` (it does) — just build the page content.
- Verify: non-admins can't reach Settings via direct URL or API (already enforced server-side; confirm
  client-side UX matches), and deactivating a user immediately blocks that user's next authenticated
  request (session lookup in `requireAuth` already checks `isActive` — verify end-to-end).
