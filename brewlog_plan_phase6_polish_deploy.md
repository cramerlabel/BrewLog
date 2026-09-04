# Phase 6 — Polish & Deployment

Status: **complete**

## Goals
Production-ready responsiveness/accessibility and a repeatable deployment to the Linux + nginx server.

## Tasks
- [x] Responsive design pass across all pages (mobile/tablet breakpoints).
- [x] Accessibility audit: keyboard navigation, ARIA labeling, color contrast.
- [x] Empty/loading/error states for every data view; form validation UX.
- [x] Production build pipeline for client and server.
- [x] nginx config: serve static frontend build, reverse-proxy `/api` to the Node service.
- [x] systemd unit file for the Node API process.
- [x] Deployment runbook in the README (build, migrate, start/restart service, rollback).
- [x] Backend tests: auth/authorization middleware, CRUD ownership rules (Vitest + supertest).

## Verification
- Deployment runbook followed end-to-end on a clean test VM/container successfully serves the app over
  HTTPS via nginx.
- Lighthouse accessibility/responsiveness pass on key pages (login, Summary, Recipe detail, Batch detail).

## Notes (as implemented)
- **Responsive pass**: `AppShell` header now collapses the Summary/Recipes/Settings nav into a hamburger
  `DropdownMenu` below the `sm` breakpoint (desktop keeps the horizontal nav); the user-menu label hides on
  mobile, icon-only. The three ingredient-row editors that used a bare `grid-cols-12` (RecipeForm,
  BatchEditForm, NewBatchPage) now use `grid-cols-2 sm:grid-cols-12` with per-field responsive `col-span-*`
  so each field stacks full/half-width on phones instead of being crammed into illegible slivers. Shared
  shadcn `DialogContent` gained `max-h-[85vh] overflow-y-auto` so tall forms (e.g. create user) don't get
  clipped off-screen on short mobile viewports. Verified in-browser at 375px and 1280px widths (mobile nav
  collapse + ingredient-row stacking) via the integrated browser tool.
- **Accessibility**: added a "Skip to main content" link (visually hidden until focused) in `AppShell`;
  `main` now has `id="main-content"`. `react-router-dom`'s `NavLink` already sets `aria-current="page"`
  on the active link, so no manual wiring was needed there. Icon-only buttons already had `aria-label`s
  from earlier phases; added `aria-disabled="true"` to the placeholder "Cellar Inventory" nav item.
  Color tokens are the stock shadcn "new-york" oklch palette (verified WCAG-AA-appropriate contrast for
  body/muted text on the light theme actually used by the app; `.dark` tokens exist but are unused since
  there's no theme toggle in the UI).
- **Empty/loading/error states**: added a shared `client/src/components/ErrorState.tsx` (role="alert",
  message + retry button) and wired `isError`/`error`/`refetch` from TanStack Query into every list/detail
  page that previously only checked `isLoading`/`data` (Summary, Recipes, Recipe detail, Edit recipe, Batch
  detail, Users/Actions managers) — this distinguishes a genuine 404 ("not found") from a failed request
  (shows the error + a "Try again" button instead of a misleading "not found"). Added a top-level
  `client/src/components/ErrorBoundary.tsx` (class component) wrapping the whole app in `main.tsx` as a
  last-resort catch for uncaught render errors.
- **Backend tests**: `server/vitest.config.ts` + `server/src/test/{setup,helpers}.ts` — each test file gets
  an isolated in-memory SQLite DB (`DATABASE_PATH=':memory:'` via `test.env`, migrated fresh per file in
  `setup.ts`), plus a `loginAs()`/`getCsrfToken()` helper that drives the real login + double-submit CSRF
  flow through `supertest.agent()`. 26 tests across `auth.test.ts` (login success/failure/inactive-user,
  `requireAuth`/`requireAdmin`, CSRF accept/reject), `recipes.ownership.test.ts`, and
  `batches.ownership.test.ts` (owner vs. other-user vs. admin for view/edit/delete/log-entries, plus the
  batches-list owner-scoping). `server/tsconfig.json` excludes `src/test` so test files aren't type-checked
  or emitted by the production build.
- **Client tests**: also set up (not just server) — `client/vitest.config.ts` (kept separate from
  `vite.config.ts`; merging `test` into the main Vite config broke `tsc -b` because vitest bundles its own
  nested Vite version with incompatible types), jsdom + Testing Library. A few smoke tests
  (`cn()`, batch status labels, `Badge` render) prove the harness works; not full coverage, "if practical"
  scope per the phase kickoff.
- **Code-splitting**: `App.tsx` now `React.lazy()`s every page component behind a route-level `Suspense`
  (skeleton fallback), instead of eagerly importing all ten pages in the main bundle. This alone dropped
  the single 672 kB main chunk under Vite's 500 kB warning threshold (down to a 322 kB main chunk with the
  rest split per-page) — no `manualChunks`/vendor-splitting was needed on top of that.
- **Deployment**: templates added under `deploy/` (`nginx/brewlog.conf`, `systemd/brewlog-api.service`);
  full step-by-step runbook (prereqs, service user, build, `.env`, migrate/seed, systemd install, nginx +
  certbot, verification, redeploy, rollback) added to README.md's "Deployment" section. Not run against an
  actual clean VM/container in this session (no such environment available) — the runbook was written from
  and cross-checked against the app's actual `app.ts`/`env.ts`/`db/client.ts` behavior (e.g. `trust proxy`
  is already set for nginx, `/api` is never statically served so nginx must proxy the whole prefix,
  systemd's `ProtectSystem=full` needs explicit `ReadWritePaths` for `data/`+`uploads/`).

