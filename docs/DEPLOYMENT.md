# Deployment Guide

For AWS-specific infrastructure choices (EC2 vs ECS Fargate), see [`AWS.md`](AWS.md). This doc covers the build/deploy mechanics that apply regardless of target.

## Build

```bash
npm run build
```

Runs, in order: `shared` (type-only, no real build artifact needed by consumers using it as source) → `database` (compiles the table definitions and admin scripts) → `server` (`tsc` to `server/dist/`) → `client` (`tsc -b && vite build` to `client/dist/`).

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
| `AWS_REGION` | server, database | The region your DynamoDB tables live in |
| `DYNAMODB_TABLE_PREFIX` | server, database | Namespaces the 22 table names; must match what `db:migrate` created |
| `DYNAMODB_ENDPOINT` | server, database | **Leave unset in production.** Setting it points the SDK at DynamoDB Local instead of AWS |
| AWS credentials | server, database | Prefer an IAM role (ECS task role / EC2 instance profile) over `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` |
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
npm run db:migrate -w database   # creates any missing table or index; run during deploy, before starting the new server version
```

DynamoDB has no migration history to replay — creating a table *is* the schema — so this one command is the whole story and is safe to re-run on every deploy. It creates tables that don't exist yet and adds any index newly declared in `database/src/schema.ts`; it never drops or rewrites anything.

What it does **not** do is backfill or reshape existing items. Adding a column with a default in `schema.ts` only affects items written afterwards — DynamoDB is schemaless per item, and the read path fills any missing declared attribute with `null`, so old items stay readable. A change that genuinely needs existing data rewritten (renaming an attribute, changing a table's primary key) needs its own one-off script.

### IAM permissions the server needs

On the prefixed tables and their indexes: `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, `Scan`, `BatchWriteItem`. `db:migrate` additionally needs `CreateTable`, `DescribeTable`, and `UpdateTable` — worth keeping on a deploy role rather than the running server's role.

## Pre-launch checklist

- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` changed from the `.env.example` defaults, and `JWT_SECRET` is a real random value
- [ ] `DYNAMODB_ENDPOINT` is **unset** (a leftover `localhost:8000` silently points production at nothing)
- [ ] `npm run db:migrate` has been run against the production account, and `DYNAMODB_TABLE_PREFIX` matches
- [ ] Point-in-time recovery enabled on the tables (DynamoDB's backup story — off by default)
- [ ] `CLIENT_ORIGIN` matches the real client URL (CORS will reject requests otherwise)
- [ ] Served over HTTPS (required for the PWA install prompt and service worker)
- [ ] `UPLOAD_DIR` is on persistent, backed-up storage
- [ ] `npm run build` succeeds with zero TypeScript errors in both `client` and `server`
