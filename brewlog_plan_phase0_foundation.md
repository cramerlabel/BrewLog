# Phase 0 — Foundation & Repo Setup

Status: **in progress**

## Goals
Get a clean, tooled monorepo in place so every later phase can focus purely on features.

## Tasks
- [x] Create GitHub repo and push initial commit.
- [x] Monorepo scaffold: `/client` (Vite React-TS), `/server` (Express-TS), `/shared` (Zod schemas).
- [x] Root `.gitignore` (node_modules, dist/build, `*.db`, `.env`, uploads/ contents).
- [x] ESLint + Prettier config shared across packages.
- [x] Root npm workspaces with `dev`, `build`, `lint` scripts.
- [x] README with local dev setup instructions.

## Verification
- `npm install` at the repo root installs all three workspaces.
- `npm run lint` runs against client/server/shared with no errors.
- `npm run dev` starts both client and server dev servers concurrently.
