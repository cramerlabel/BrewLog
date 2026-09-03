# BrewLog

Multi-user management and tracking system for homemade beer and wine — recipes, batches, and (eventually)
cellar inventory. Self-hosted, local auth, no external services.

See [brewlog_plan.md](brewlog_plan.md) for the full design: tech stack, data model, authorization rules,
security notes, and the phase-by-phase build plan.

## Repo Layout

```
/client    React + TypeScript + Vite frontend
/server    Express + TypeScript backend (API, SQLite via Drizzle, sessions, uploads)
/shared    Zod schemas + inferred types shared by client and server
```

## Prerequisites

- Node.js 20+ and npm 10+

## Getting Started

```bash
npm install               # installs all three workspaces
cp server/.env.example server/.env   # then edit secrets/paths as needed
npm run dev                # runs client (http://localhost:5173) and server (http://localhost:4000) together
```

## Scripts (run from repo root)

- `npm run dev` — client + server dev servers concurrently
- `npm run build` — build shared, then server, then client
- `npm run lint` — lint all workspaces
- `npm run format` — format the repo with Prettier

## Deployment

Deployment steps (nginx reverse proxy + systemd service) are documented in
[brewlog_plan_phase6_polish_deploy.md](brewlog_plan_phase6_polish_deploy.md) and will be expanded into a full
runbook here once that phase is implemented.
