# BrewLog — Planning Document

Multi-user web app to manage and track homemade beer & wine batches. Recipes are viewable by all
authenticated users but editable only by their creator or an admin. Batches are private — visible and
editable only by their owner or an admin. Self-hosted on a single Linux server behind nginx, with no
external services: auth, sessions, and file storage are all local to the box.

This file is the master reference. Each phase has its own checklist file: `brewlog_plan_phase0_foundation.md`
through `brewlog_plan_phase7_cellar_inventory.md`.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite, shadcn/ui (Radix + Tailwind), React Router, TanStack Query,
  React Hook Form + Zod.
- **Backend**: Node.js + Express + TypeScript, Drizzle ORM + better-sqlite3, argon2 password hashing,
  express-session with a SQLite-backed session store, multer for photo uploads.
- **Shared**: `/shared` package holding Zod schemas + inferred types, imported by both `/client` and
  `/server` so validation and types never drift between front and back end.
- **Deployment**: nginx serves the built static frontend and reverse-proxies `/api` to a Node process
  managed by systemd. No Docker.

## Key Decisions
- **Auth**: server-side sessions via httpOnly/secure/sameSite cookie. Roles: `admin`, `user`. CSRF
  protection required on all state-changing requests since sessions are cookie-based.
- **User accounts**: admin-only creation — no public self-signup, since batches are private per-user.
- **Account menu**: every logged-in user can change their own password/display name from a small Account
  menu, kept separate from the admin-only Settings section.
- **Recipe → Batch link**: snapshot copy. Starting a batch copies the recipe's ingredients/steps into the
  batch's own editable records; the batch keeps a nullable `recipe_id` reference for provenance only.
- **Ingredients & steps**: structured line items (not freeform text) for both recipes and batches, so they
  can be scaled, converted, and consistently snapshotted.
- **Batch log entries**: entry_date, an optional action (from an admin-managed Actions list), OG/FG,
  Brix/SG, pH, temperature(+unit), freeform notes, and an optional photo. Action *detail* goes in the notes
  field — the action field itself is just the picked action from the list.
- **Actions list**: admin-managed lookup table (name, description, `applicable_to`: beer/wine/both, active,
  sort order). The UI filters the action picker by the batch/recipe's type so beer-only or wine-only actions
  don't show up for the wrong type.
- **Batch status**: fixed enum, not admin-configurable like Actions: `planning`, `fermenting`,
  `conditioning`, `bottled_kegged`, `aging`, `completed`, `archived`. "Open" = anything except `completed`
  or `archived`.
- **Batch numbering**: per-year human-readable code (e.g. `2026-001`), sequence resets each calendar year.
  Generated server-side.
- **Photos** (recipe photo, batch log entry photos): stored with randomized filenames, served only through
  an authenticated Express route — never a public nginx static path — since the app has no anonymous access
  and batch data must stay private.
- **Password reset**: admin-driven only via Settings > Users. No email flow in v1.

## Data Model (SQLite via Drizzle)
- **users**: id, username (unique), email (nullable unique), password_hash, display_name, role
  (admin|user), is_active, created_at, updated_at.
- **sessions**: sid (pk), user_id, sess (json), expires_at.
- **actions**: id, name (unique), description, applicable_to (beer|wine|both), is_active, sort_order,
  created_at.
- **recipes**: id, name, type (beer|wine), style, description, batch_size, batch_size_unit, target_og,
  target_fg, target_abv, photo_path (nullable), created_by (fk users), created_at, updated_at.
- **recipe_ingredients**: id, recipe_id, sort_order, category, name, amount, unit, notes.
- **recipe_steps**: id, recipe_id, step_number, text.
- **batches**: id, recipe_id (nullable fk), recipe_name_snapshot, type, name, batch_number, status,
  start_date, end_date, final_yield_amount, final_yield_unit, final_abv, notes, owner_id (fk users),
  created_at, updated_at.
- **batch_ingredients**: same shape as recipe_ingredients but batch_id.
- **batch_steps**: same shape as recipe_steps but batch_id, plus is_done bool.
- **batch_log_entries**: id, batch_id, entry_date, action_id (nullable fk actions), og, fg, brix, sg, ph,
  temperature, temperature_unit, notes, created_by (fk users), created_at.
- **batch_log_photos**: id, log_entry_id, file_path (randomized filename), original_filename, uploaded_at.

## Authorization Rules
- Recipes: viewable by all authenticated users; editable only by `created_by` or `admin`.
- Batches: viewable/editable only by `owner_id` or `admin` — not visible to other regular users at all
  (list/detail/API endpoints must filter by owner unless the requester is an admin).
- Settings (user management, Actions list management): admin only.
- All authorization is enforced server-side in Express middleware — client-side role checks are UX only.

## Security Notes (OWASP-aligned, applies across all phases)
- Parameterized queries via Drizzle — no raw string SQL, to prevent injection.
- argon2id password hashing with a minimum password length/complexity policy.
- Rate limiting + generic error messages on the login endpoint (avoid user enumeration/brute force).
- CSRF protection on state-changing requests (cookie-based sessions).
- Secure cookies: httpOnly, secure, sameSite.
- File uploads: allowlist mime types/extensions, size limits, randomized stored filenames, served only via
  an authenticated route.
- helmet for HTTP security headers; HTTPS via nginx + certbot at deploy time.
- Zod validation of all request bodies server-side (client-side validation is UX only, not a security
  boundary).

## Phase Index
0. [Foundation & Repo Setup](brewlog_plan_phase0_foundation.md)
1. [Backend Core (Data + Auth)](brewlog_plan_phase1_backend_core.md)
2. [Frontend Shell](brewlog_plan_phase2_frontend_shell.md)
3. [Recipes](brewlog_plan_phase3_recipes.md)
4. [Batches & Summary](brewlog_plan_phase4_batches_summary.md)
5. [Settings / Admin](brewlog_plan_phase5_settings_admin.md)
6. [Polish & Deployment](brewlog_plan_phase6_polish_deploy.md)
7. [Cellar Inventory (future, planning only)](brewlog_plan_phase7_cellar_inventory.md)

## Repo Layout
```
/client    React + TS + Vite frontend
/server    Express + TS backend (API, DB, sessions, uploads)
/shared    Zod schemas + inferred types shared by client and server
```
