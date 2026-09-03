# Phase 2 — Frontend Shell

Status: **complete**

## Goals
Application shell that every feature page will plug into: theming, routing, auth state, data fetching.

## Tasks
- [x] Vite + TS + Tailwind + shadcn/ui installed and themed.
- [x] React Router layout: public login page + authenticated app shell.
- [x] Nav: Recipes, Summary, Settings (admin only), Cellar Inventory (disabled placeholder).
- [x] TanStack Query client + typed API client wrapper (using `/shared` Zod schemas/types).
- [x] Auth context/hook: current user, role, login/logout.
- [x] Protected route wrapper + admin-only route wrapper.
- [x] Account menu: change own password/display name.

## Verification
- Logging in redirects to the app shell; logging out redirects to login. **Verified in-browser.**
- Visiting an admin-only route as a non-admin redirects away. **Verified in-browser** (`/settings` as
  `brewer1` redirects to `/`).
- Refreshing the page preserves the session (cookie-based) without re-login — session cookie + `/auth/me`
  query on boot handles this.

## Notes
- Added two small self-service auth endpoints to the server (`PATCH /api/auth/me`,
  `POST /api/auth/change-password`) since the Account menu requires them and Phase 1 only covered
  admin-driven user management.
- Tailwind v4 (CSS-first config, no `tailwind.config.js`) + shadcn/ui `new-york` style, components added via
  the shadcn CLI into `client/src/components/ui`.
- Vite dev server proxies `/api` to `http://localhost:4000` so cookies/CSRF work identically in dev and
  prod (both same-origin from the browser's perspective).

