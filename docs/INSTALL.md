# Install & Local Development

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL 16, via **either**:
  - Docker Desktop (`docker compose up -d postgres` from the repo root), **or**
  - A locally installed Postgres instance — just point `DATABASE_URL` at it.

## 1. Install dependencies

```bash
npm install
```

This is an npm-workspaces monorepo (`client`, `server`, `database`, `shared`) — one install at the root wires everything, including the internal `@app/shared` and `@app/database` packages.

## 2. Configure environment

```bash
cp .env.example .env
```

Copy `.env.example` to `.env` in the root, **and** into `client/.env`, `server/.env`, and `database/.env` (each workspace loads its own `.env` since scripts run with that workspace as `cwd`).

At minimum, set:
- `DATABASE_URL`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — your login. Change these from the placeholder defaults.
- `JWT_SECRET` — generate a real one with `openssl rand -hex 48` (or `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`). Must be at least 32 characters.

## 3. Start Postgres

```bash
docker compose up -d postgres
```

or point `DATABASE_URL` at your own local Postgres. Either way, verify it's reachable before continuing.

## 4. Run migrations and seed data

```bash
npm run db:generate -w database   # generates SQL from database/src/schema.ts (already generated once, re-run after schema changes)
npm run db:migrate  -w database   # applies migrations to DATABASE_URL
npm run db:seed     -w database   # populates realistic demo data (idempotent — skips if events already exist)
```

The seed script creates the single admin `app_users` row matching `ADMIN_EMAIL`, plus ~4 months of realistic club activity (Orientation, Installation, Leadership Seminar, Catalyst, District Conference, Walkathon, Blood Donation Camp), built-in checklist templates, 8 people, tags, and a few comments/notes/attachments — enough to exercise every page without manual data entry.

## 5. Run the app

```bash
npm run dev
```

Starts the server (`:4000`) and client (`:5173`) concurrently. Open http://localhost:5173 and sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in step 2.

## Auth model

This is a **single-admin, personal-use app** — there is no sign-up, no multi-user support, and no external identity provider. The server checks the submitted email/password against `ADMIN_EMAIL`/`ADMIN_PASSWORD` in its env, and if they match, issues a JWT (signed with `JWT_SECRET`) that the client stores in `localStorage` and attaches to every API request. See [`ARCHITECTURE.md`](ARCHITECTURE.md) for details and [`ROADMAP.md`](ROADMAP.md) for what multi-user support would take later.

**Change the default password** (`ChangeMe123!` in `.env.example`) before running this anywhere reachable by anyone but you.

## Common tasks

- `npm run dev` — client + server, hot reload.
- `npm run build` — production build of every workspace.
- `npm run lint` — ESLint across client + server.
- `npm run db:studio -w database` — Drizzle Studio (visual DB browser).

## Known accepted risk

`npm audit` flags a high-severity advisory in `react-router` (CSRF bypass in **RSC/framework mode**). This app only uses React Router's plain client-side `createBrowserRouter` — no RSC, no server actions/loaders — so the advisory's attack surface doesn't apply. No non-breaking patched release exists yet at time of writing; revisit when one ships.
