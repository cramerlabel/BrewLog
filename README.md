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
/deploy    nginx site config + systemd unit template (see "Deployment" below)
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
- `npm run test` — run the server test suite (Vitest + supertest), then the client test suite
- `npm run format` — format the repo with Prettier

## Testing

- **Server** (`server/`): Vitest + supertest against the real Express app (`createApp()`), backed by an
  isolated in-memory SQLite database per test file (migrated fresh via `server/src/test/setup.ts`, no
  shared state between test files). Covers `requireAuth`/`requireAdmin`/`requireOwnerOrAdmin`, the
  login/CSRF flow, and recipe/batch ownership rules (owner vs. other user vs. admin). Run with
  `npm run test -w server` or `cd server && npx vitest` for watch mode.
- **Client** (`client/`): Vitest + jsdom + Testing Library, configured in `client/vitest.config.ts` (kept
  separate from `vite.config.ts` — merging `test` into the main Vite config pulls in vitest's own nested
  Vite types and breaks `tsc -b`). Currently covers a couple of pure-logic/component smoke tests
  (`cn()`, batch status labels, `Badge`) to prove the harness works end-to-end; expand with real
  component/page tests as a natural next step. Run with `npm run test -w client`.

## Deployment

Target: a single Linux server (Ubuntu/Debian assumed below) running the Node API under systemd, with
nginx serving the built client and reverse-proxying `/api` to the Node process over HTTP on localhost.
No Docker. Config templates live in [`deploy/`](deploy/):

```
deploy/
  nginx/brewlog.conf            # static client + /api reverse proxy, HTTP->HTTPS redirect
  systemd/brewlog-api.service   # runs the built server as an unprivileged service
```

### 1. Prerequisites on the server

```bash
# Node.js 20+ (via NodeSource, or your preferred method)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# TLS certs via certbot (nginx plugin)
sudo apt-get install -y certbot python3-certbot-nginx
```

### 2. Create a dedicated service user + install directory

```bash
sudo useradd --system --home /opt/brewlog --shell /usr/sbin/nologin brewlog
sudo mkdir -p /opt/brewlog
sudo chown brewlog:brewlog /opt/brewlog
```

### 3. Deploy the code and build

Run as the `brewlog` user (`sudo -u brewlog -s`) or `chown` afterwards — either way the service user
needs to own everything under `/opt/brewlog`.

```bash
cd /opt/brewlog
git clone https://github.com/cramerlabel/BrewLog.git .   # or `git pull` on redeploys
npm ci
npm run build              # builds shared -> server (dist/) -> client (dist/)
```

### 4. Configure the environment

```bash
cp server/.env.example server/.env
$EDITOR server/.env
```

Set at minimum:
- `NODE_ENV=production`
- `SESSION_SECRET` — a long random value (`openssl rand -hex 32`), **must** differ from the default
- `DATABASE_PATH` / `UPLOADS_DIR` — defaults (`./data/brewlog.db`, `./uploads`, both under `server/`) are
  fine as long as the `brewlog` user can write to them
- `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` — used once by the seed script below

### 5. Initialize the database

```bash
cd /opt/brewlog/server
npm run db:migrate    # creates/updates all tables
npm run db:seed       # creates the first admin user (no-ops if an admin already exists)
```

### 6. Install and start the systemd service

```bash
sudo cp /opt/brewlog/deploy/systemd/brewlog-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now brewlog-api
sudo systemctl status brewlog-api   # should be "active (running)"
```

### 7. Configure nginx + TLS

```bash
sudo cp /opt/brewlog/deploy/nginx/brewlog.conf /etc/nginx/sites-available/brewlog.conf
# Edit server_name to your real domain in both server blocks
$EDITOR /etc/nginx/sites-available/brewlog.conf
sudo ln -s /etc/nginx/sites-available/brewlog.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Issue a cert for the domain (also rewrites the config's ssl_certificate paths if not already set)
sudo certbot --nginx -d brewlog.example.com
```

### 8. Verify

```bash
curl -s http://127.0.0.1:4000/api/health          # {"status":"ok"} directly from the Node process
curl -sk https://brewlog.example.com/api/health   # same, through nginx + TLS
```

Then open `https://brewlog.example.com` in a browser and log in with the seeded admin account.

### Redeploying (new code)

```bash
cd /opt/brewlog
git pull
npm ci
npm run build
npm run db:migrate -w server   # safe to run even if there are no new migrations
sudo systemctl restart brewlog-api
```

nginx doesn't need to be touched for app-code redeploys — it always serves whatever is currently in
`client/dist` and proxies to whatever the running `brewlog-api` service answers on.

### Rollback

```bash
cd /opt/brewlog
git checkout <previous-tag-or-commit>
npm ci
npm run build
sudo systemctl restart brewlog-api
```

Drizzle migrations in this project are additive (new tables/columns), so rolling back the *code* to a
version older than the last migration is safe — the extra column(s)/table(s) are simply unused by the
older code. There is no automatic migration rollback; if a migration ever needs to be reverted, write and
apply a new forward migration that undoes it.

