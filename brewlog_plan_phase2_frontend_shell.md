# Phase 2 — Frontend Shell

Status: **not started**

## Goals
Application shell that every feature page will plug into: theming, routing, auth state, data fetching.

## Tasks
- [ ] Vite + TS + Tailwind + shadcn/ui installed and themed.
- [ ] React Router layout: public login page + authenticated app shell.
- [ ] Nav: Recipes, Summary, Settings (admin only), Cellar Inventory (disabled placeholder).
- [ ] TanStack Query client + typed API client wrapper (using `/shared` Zod schemas/types).
- [ ] Auth context/hook: current user, role, login/logout.
- [ ] Protected route wrapper + admin-only route wrapper.
- [ ] Account menu: change own password/display name.

## Verification
- Logging in redirects to the app shell; logging out redirects to login.
- Visiting an admin-only route as a non-admin redirects away or shows a 403 page.
- Refreshing the page preserves the session (cookie-based) without re-login.
