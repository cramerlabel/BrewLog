# Phase 5 — Settings / Admin

Status: **not started**

## Goals
Admin-only area for user and Actions-list management.

## Tasks
- [ ] Users tab: list, create, edit role, activate/deactivate, reset password.
- [ ] Actions tab: manage action list (add/edit/deactivate/reorder, `applicable_to` field).
- [ ] Admin-only route/page guard enforced both client-side (UX) and server-side (authorization).

## Verification
- Non-admin users cannot reach Settings pages directly by URL, and the underlying API routes reject
  non-admin requests.
- Deactivating a user immediately prevents that user's session from accessing protected routes.
