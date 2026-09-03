# Phase 6 — Polish & Deployment

Status: **not started**

## Goals
Production-ready responsiveness/accessibility and a repeatable deployment to the Linux + nginx server.

## Tasks
- [ ] Responsive design pass across all pages (mobile/tablet breakpoints).
- [ ] Accessibility audit: keyboard navigation, ARIA labeling, color contrast.
- [ ] Empty/loading/error states for every data view; form validation UX.
- [ ] Production build pipeline for client and server.
- [ ] nginx config: serve static frontend build, reverse-proxy `/api` to the Node service.
- [ ] systemd unit file for the Node API process.
- [ ] Deployment runbook in the README (build, migrate, start/restart service, rollback).
- [ ] Backend tests: auth/authorization middleware, CRUD ownership rules (Vitest + supertest).

## Verification
- Deployment runbook followed end-to-end on a clean test VM/container successfully serves the app over
  HTTPS via nginx.
- Lighthouse accessibility/responsiveness pass on key pages (login, Summary, Recipe detail, Batch detail).
