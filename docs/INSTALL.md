# Install & Local Development

## Prerequisites

- Node.js 20+ and npm
- DynamoDB for development, via **either**:
  - Docker Desktop (`docker compose up -d dynamodb` from the repo root) — recommended, **or**
  - A real AWS account: leave `DYNAMODB_ENDPOINT` unset and let the SDK use your shared AWS profile. Tables are created in your account and cost real (small) money.

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
- `DYNAMODB_ENDPOINT` — `http://localhost:8000` for DynamoDB Local; **leave it unset** to talk to real AWS.
- `AWS_REGION` and `DYNAMODB_TABLE_PREFIX` — the prefix keeps table names from colliding, since DynamoDB names are global per account+region.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — your login. Change these from the placeholder defaults.
- `JWT_SECRET` — generate a real one with `openssl rand -hex 48` (or `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`). Must be at least 32 characters.

## 3. Start DynamoDB Local

```bash
docker compose up -d dynamodb
```

It listens on `:8000`. Verify it's reachable before continuing — an unauthenticated `curl http://localhost:8000` answering `400` means it's up and serving.

Optionally, `docker compose up -d dynamodb-admin` starts a web table browser on http://localhost:8001.

## 4. Create the tables

```bash
npm run db:migrate
```

This creates all 22 tables and their secondary indexes. DynamoDB has no DDL migration history to replay — creating a table *is* the schema — so the script is **idempotent**: re-run it any time, and it creates what's missing and adds any index declared in `database/src/schema.ts` since the table was made.

There is no seed script — the tables start empty. The single admin `app_users` item is created automatically on first login (matched against `ADMIN_EMAIL`), and everything else (events, people, tasks, etc.) is created through the app itself.

## 5. Run the app

```bash
npm run dev
```

Starts the server (`:4000`) and client (`:5173`) concurrently. Open http://localhost:5173 and sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in step 2.

## Migrating data from the old Postgres database

If you have an existing Postgres database from before the DynamoDB switch, copy it across in one command. Point `DATABASE_URL` at the **old** database — nothing else in the app reads that variable any more:

```bash
# Preview first: reports the row count per table, writes nothing.
DATABASE_URL=postgres://user:pass@localhost:5432/rotaract \
  npm run db:import-postgres -w database -- --dry-run

# Then do it for real.
DATABASE_URL=postgres://user:pass@localhost:5432/rotaract \
  npm run db:import-postgres -w database
```

It reads every table and writes the rows into the matching DynamoDB table, preserving ids, timestamps, and values exactly — only column *naming* changes (Postgres stored `snake_case`; DynamoDB items use the `camelCase` the API has always returned). Re-running is safe: writes are keyed puts, so a second pass overwrites rather than duplicates.

## Auth model

This is a **single-admin, personal-use app** — there is no sign-up, no multi-user support, and no external identity provider. The server checks the submitted email/password against `ADMIN_EMAIL`/`ADMIN_PASSWORD` in its env, and if they match, issues a JWT (signed with `JWT_SECRET`) that the client stores in `localStorage` and attaches to every API request. See [`ARCHITECTURE.md`](ARCHITECTURE.md) for details and [`ROADMAP.md`](ROADMAP.md) for what multi-user support would take later.

**Change the default password** (`ChangeMe123!` in `.env.example`) before running this anywhere reachable by anyone but you.

## Common tasks

- `npm run dev` — client + server, hot reload.
- `npm run build` — production build of every workspace.
- `npm run lint` — ESLint across client + server.
- `npm run db:migrate` — create any missing tables/indexes (safe to re-run).
- `npm run db:reset` — empty every table but keep them. The `TRUNCATE` equivalent; DynamoDB has no truncate, so it scans keys and batch-deletes.
- `npm run db:drop` — delete the tables outright. Refuses to run against real AWS unless you pass `--force`.
- `docker compose up -d dynamodb-admin` — web table browser on http://localhost:8001.

## Known accepted risk

`npm audit` flags a high-severity advisory in `react-router` (CSRF bypass in **RSC/framework mode**). This app only uses React Router's plain client-side `createBrowserRouter` — no RSC, no server actions/loaders — so the advisory's attack surface doesn't apply. No non-breaking patched release exists yet at time of writing; revisit when one ships.
