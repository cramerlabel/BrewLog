# Phase 5 — Settings / Admin

Status: **complete**

## Goals
Admin-only area for user and Actions-list management.

## Tasks
- [x] Users tab: list, create, edit role, activate/deactivate, reset password.
- [x] Actions tab: manage action list (add/edit/deactivate/reorder via `sortOrder`, `applicable_to` field).
- [x] Admin-only route/page guard enforced both client-side (UX) and server-side (authorization).

## Verification
- Non-admin users cannot reach Settings pages directly by URL, and the underlying API routes reject
  non-admin requests.
- Deactivating a user immediately prevents that user's session from accessing protected routes.

## Notes
- Built `client/src/features/users/{types,api,hooks}.ts` + `CreateUserDialog`/`EditUserDialog`/
  `ResetPasswordDialog`/`UsersManager` following the recipes/batches `{types,api,hooks}` pattern.
- Extended `client/src/features/actions/{api,hooks}.ts` (previously read-only) with admin
  create/update mutations, plus `CreateActionDialog`/`EditActionDialog`/`ActionsManager`.
- Added shadcn `tabs`, `dialog`, `switch` UI primitives (none existed yet).
- Replaced the placeholder `SettingsPage.tsx` with a `Tabs` (Users/Actions) layout.
- Admin self-protection: `EditUserDialog` disables the role select and active switch when editing
  your own account (mirrors the server's existing self-lockout guard in `users.routes.ts`).
- Verified end-to-end in-browser and via curl:
  - Non-admin (`testuser`) navigating to `/settings` is redirected client-side to `/`; no Settings
    nav link is rendered for non-admins.
  - `GET /api/users` with a non-admin session cookie returns `403`.
  - After an admin deactivates a user via the UI, the *same already-authenticated* session
    immediately gets `401` on both `/api/auth/me` and a normal protected route (`/api/batches`) —
    confirms `requireAuth`'s per-request `isActive` check closes the session instantly, no re-login
    needed to observe the lockout.
