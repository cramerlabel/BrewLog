# Project State — BrewLog

## Project summary
BrewLog is a multi-user web app for managing and tracking homemade beer/wine recipes and batches.
Recipes are viewable by all authenticated users but editable only by their creator or an admin.
Batches are private — visible/editable only by their owner or an admin. Self-hosted on a single Linux
server behind nginx; auth, sessions, and file storage are all local (no external services).

## Current phase
Phases 0–6 complete (foundation, backend auth core, frontend shell, recipes, batches/summary,
settings/admin UI, polish/deploy).
Next phase: **Phase 7 — Cellar Inventory** (planning only so far).

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
- **Phase 5**: Settings page replaced with a tabbed Users/Actions admin UI —
  `client/src/features/users/{types,api,hooks,CreateUserDialog,EditUserDialog,ResetPasswordDialog,
  UsersManager}` and extended `client/src/features/actions/{api,hooks}` +
  `{CreateActionDialog,EditActionDialog,ActionsManager}`. Added shadcn `tabs`/`dialog`/`switch`
  primitives. Verified (browser + curl): non-admins are redirected client-side away from `/settings`
  and get `403` from `/api/users`; deactivating a user immediately invalidates that user's *existing*
  session (401 on next request, no re-login needed) via `requireAuth`'s per-request `isActive` check.
- **Phase 6**: Responsive pass (mobile hamburger nav in `AppShell`, ingredient-row grids stack on mobile,
  dialogs scroll on short viewports), accessibility pass (skip-to-content link, `aria-disabled` on the
  Cellar Inventory placeholder, verified `NavLink`'s built-in `aria-current`), empty/loading/error-state
  audit (new shared `ErrorState` component + `isError`/`refetch` wired into every list/detail page, plus a
  top-level `ErrorBoundary`), first automated test suite (`server`: Vitest + supertest, 26 tests covering
  auth/CSRF/ownership; `client`: Vitest + Testing Library harness with smoke tests), route-level
  code-splitting (`React.lazy` per page) which resolved the bundle-size warning, and deployment artifacts
  (`deploy/nginx/brewlog.conf`, `deploy/systemd/brewlog-api.service`, full runbook in README.md).
- All phases verified via curl (auth/ownership edge cases) **and** live browser testing (login flows,
  CRUD, privacy checks, filters, and - for Phase 6 - mobile-viewport nav/form rendering).

## Not completed
- **Phase 7**: Cellar Inventory — planning only, not built (disabled nav placeholder already in AppShell).
- Minor known issue: a benign console 404 can appear briefly after deleting a recipe/batch (a
  React Query background refetch of the just-invalidated detail query racing the navigation away) —
  cosmetic only, not a functional bug.
- The Phase 6 deployment runbook (README.md "Deployment") was written and cross-checked against the app's
  actual proxy/env/systemd requirements, but has not been executed end-to-end against a real clean
  VM/container in this session - worth a dry run before the first real production deploy.
- No Lighthouse CI numbers were captured (no headless Lighthouse tooling available in this session); the
  responsive/accessibility changes were verified via the integrated browser tool at 375px/1280px widths and
  a manual review of ARIA/contrast, not an automated Lighthouse score.

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
- **Deployment**: nginx serves the built client + reverse-proxies `/api`; Node API runs via systemd. No
  Docker. Templates in `deploy/nginx/brewlog.conf` and `deploy/systemd/brewlog-api.service`; full runbook
  in README.md "Deployment" (Phase 6).

## Important files
- `brewlog_plan.md` — master plan: full data model, authorization rules, security notes, phase index.
- `brewlog_plan_phase7_cellar_inventory.md` — planning doc for the next phase (not yet built).
- `server/src/db/schema.ts` — Drizzle schema for all tables (source of truth for data model).
- `server/src/middleware/auth.ts` — `requireAuth`, `requireAdmin`, `requireOwnerOrAdmin`.
- `server/src/routes/users.routes.ts` and `server/src/routes/actions.routes.ts` — admin Users/Actions
  backend (Phase 1), consumed by the Phase 5 frontend.
- `client/src/pages/SettingsPage.tsx` — tabbed Users/Actions admin page (Phase 5).
- `client/src/features/recipes/`, `client/src/features/batches/`, `client/src/features/users/`,
  `client/src/features/actions/` — reference `{types,api,hooks}` + form/dialog pattern for any future
  feature module.
- `client/src/auth/route-guards.tsx` — `RequireAdmin` wraps the `/settings` route in `App.tsx`.
- `server/src/test/{setup,helpers}.ts` + `server/vitest.config.ts` — backend test harness (isolated
  in-memory SQLite per test file, login/CSRF helpers) - copy this pattern for any new backend test file.
- `client/vitest.config.ts` + `client/src/test/setup.ts` — frontend test harness (jsdom + Testing Library).
- `client/src/components/{ErrorState,ErrorBoundary}.tsx` — shared query-error and render-error UI; wire
  `ErrorState` into any new list/detail page's `isError` branch rather than only checking `isLoading`/`data`.
- `deploy/nginx/brewlog.conf`, `deploy/systemd/brewlog-api.service` — deployment config templates;
  README.md "Deployment" has the full runbook.

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
- Backend tests: put new test files under `server/src/test/*.test.ts`; import `createApp` from `app.ts`
  and use `createUser`/`loginAs`/`getCsrfToken` from `server/src/test/helpers.ts` to get an authenticated
  `supertest` agent with a valid CSRF token already primed. Each test file gets its own fresh in-memory DB
  (migrated by `server/src/test/setup.ts`) — no manual cleanup needed between test files.
- Frontend list/detail pages: destructure `isError`/`error`/`refetch` from the `useQuery` result (not just
  `isLoading`/`data`) and render `<ErrorState message={...} onRetry={...} />` — don't let a failed fetch
  fall through to a misleading "not found" message.
- New pages should be added to `App.tsx` via `lazy(() => import('@/pages/Foo').then((m) => ({ default:
  m.Foo })))` (named export, not default) rather than a static top-level import, to keep route-level
  code-splitting working as the app grows.
- Commit messages follow `Phase N: <summary>`; each phase's `brewlog_plan_phaseN_*.md` file is updated
  (checkboxes + a short verification/notes section) as part of that phase's commit.
- Repo-scoped conventions and gotchas (shadcn CLI alias quirk, RHF/zod generic fix, etc.) are also saved in
  local Claude/Copilot memory at `/memories/repo/conventions.md` if the next session's tool has access to
  it; this handoff file is the portable, tool-agnostic version.

## Known issues
- See "Not completed" above (cosmetic delete-refetch 404, unexecuted-on-a-real-VM runbook, no captured
  Lighthouse numbers) — nothing blocking.
- Dev-only transitive vulnerability in esbuild via vitest/drizzle-kit (dev server only, not shipped);
  accepted risk, would require a vitest 5 major bump to fully clear. The client's new Vitest devDependency
  has the same accepted esbuild/vite transitive advisory for the same reason.

## Next session should read first
1. `brewlog_plan_phase7_cellar_inventory.md` — exact scope for the next phase (currently planning-only).
2. `brewlog_plan.md` — full data model + authorization rules.
3. This handoff's Architecture/Conventions sections below.

## Next phase goal
Phase 7 — Cellar Inventory: flesh out the planning doc into an implementation plan, then build it
(data model, API, and UI) following the same `{types,api,hooks}` + form/dialog conventions as the
recipes/batches/users/actions features. Before starting, consider doing a real dry-run of the Phase 6
deployment runbook against a clean VM/container, since that was written but not executed end-to-end.
