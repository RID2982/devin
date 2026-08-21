# Club Events & Tasks

A month-wise event & task management platform for running a club's recurring events — built as a personal-use, production-grade Phase 1 core (real database, real auth, real UI) with a clear roadmap for what comes next.

## Stack

- **Client**: React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui-style components (hand-authored on Radix primitives), React Router 7, React Hook Form, TanStack Query, Zustand, Framer Motion, `vite-plugin-pwa`, `react-big-calendar`, `dnd-kit`, `cmdk`.
- **Server**: Node.js, Express, TypeScript, AWS SDK v3 (DynamoDB DocumentClient), Zod, Multer, Pino.
- **Database**: Amazon DynamoDB — 22 tables, one per entity. DynamoDB Local for development.
- **Auth**: single hardcoded admin login (`ADMIN_EMAIL`/`ADMIN_PASSWORD` in env, JWT issued and verified by the server itself) — this is a personal-use tool for one person, not a multi-tenant app. No Cognito, no external identity provider — the database runs on AWS, the login does not.
- **Storage**: Local disk (`server/uploads/`) in Phase 1.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full design, [`docs/INSTALL.md`](docs/INSTALL.md) to get running locally, [`docs/AWS.md`](docs/AWS.md) for deployment options, and [`docs/ROADMAP.md`](docs/ROADMAP.md) for what's intentionally deferred.

## Quick start

```bash
npm install
cp .env.example .env          # then set ADMIN_EMAIL / ADMIN_PASSWORD / JWT_SECRET
docker compose up -d dynamodb # DynamoDB Local on :8000
npm run db:migrate            # creates the 22 tables (idempotent)
npm run dev                   # client on :5173, server on :4000
```

Sign in at http://localhost:5173/login with the `ADMIN_EMAIL`/`ADMIN_PASSWORD` you set — the admin account is created automatically on first login, no seeding required. Full step-by-step instructions are in [`docs/INSTALL.md`](docs/INSTALL.md).

## Monorepo layout

```
client/     React app
server/     Express API
database/   DynamoDB table definitions, table-creation + reset scripts, Postgres import
shared/     Types/enums/constants shared by client + server
docs/       API.md, INSTALL.md, DEPLOYMENT.md, ARCHITECTURE.md, AWS.md, ROADMAP.md
```
