# Deployment Guide

For AWS-specific infrastructure choices (EC2 vs ECS Fargate), see [`AWS.md`](AWS.md). This doc covers the build/deploy mechanics that apply regardless of target.

## Build

```bash
npm run build
```

Runs, in order: `shared` (type-only, no real build artifact needed by consumers using it as source) → `database` (compiles migration/seed helpers) → `server` (`tsc` to `server/dist/`) → `client` (`tsc -b && vite build` to `client/dist/`).

## Running in production

```bash
# server
NODE_ENV=production node server/dist/server.js

# client
# client/dist/ is a static build — serve it via Nginx, S3+CloudFront,
# or `express.static` from the same server process if you want a single deployable unit.
```

## Required environment variables (production)

| Variable | Where | Notes |
|---|---|---|
| `DATABASE_URL` | server, database | Points at RDS or your production Postgres |
| `PORT` | server | Defaults to 4000 |
| `CLIENT_ORIGIN` | server | Must match the client's real origin (CORS) |
| `UPLOAD_DIR` | server | Persistent disk path; back this up or migrate to S3 |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | server | Your login — **do not ship the `.env.example` defaults** |
| `JWT_SECRET` | server | Generate with `openssl rand -hex 48`; changing it invalidates all issued tokens (forces re-login) |
| `VITE_API_URL` | client (build-time) | The server's public URL + `/api/v1` |
| `EMAIL_TRANSPORT` | server | `console` (default stub) until real SMTP is wired — see `ROADMAP.md` |

**Important**: `VITE_*` variables are baked into the client bundle at build time, not read at runtime — rebuild the client whenever they change.

## Database migrations in production

```bash
npm run db:generate -w database   # after any schema.ts change, generates SQL — commit the output
npm run db:migrate  -w database   # applies pending migrations; run this during deploy, before starting the new server version
```

## Pre-launch checklist

- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` changed from the `.env.example` defaults, and `JWT_SECRET` is a real random value
- [ ] `DATABASE_URL` points at a production Postgres with backups enabled
- [ ] `CLIENT_ORIGIN` matches the real client URL (CORS will reject requests otherwise)
- [ ] Served over HTTPS (required for the PWA install prompt and service worker)
- [ ] `UPLOAD_DIR` is on persistent, backed-up storage
- [ ] `npm run build` succeeds with zero TypeScript errors in both `client` and `server`
