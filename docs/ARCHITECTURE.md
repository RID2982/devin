# Architecture

## Monorepo

npm workspaces: `client/`, `server/`, `database/`, `shared/`. `shared/` exports TypeScript source directly (no build step needed in dev — both Vite and `tsx` transpile TS natively); `database/` exports the Drizzle schema and a ready-to-use `db` client so the server never talks to Postgres directly.

## Data model

No literal `Month` table. Month/year is always derived from `events.date` (an indexed timestamp) — the Monthly Planner buckets events by year/month in the service layer off one indexed query. A `month_settings(year, month)` table is a one-line addition later if a real per-month attribute (e.g. a monthly budget cap) is ever needed — nothing in the current design blocks it.

Archive, never delete. Archivable tables (`events`, `tasks`, `people`, `notes`) carry a nullable `archived_at`. Default queries filter it out; the Archive page queries the inverse; restoring clears it. The UI never hard-deletes user-generated content.

See `database/src/schema.ts` for the full table list (21 tables) — events, tasks, people, join tables for assignments/dependencies/tags, checklist items + templates, comments, attachments, notes, activity logs, email logs, notifications, a schema-only `permissions` placeholder for future sharing, and `app_users` (the single admin account row).

## Backend layering

```
routes -> auth middleware (JWT) -> zod validators -> controllers (thin) -> services (business rules) -> repositories (pure Drizzle queries) -> Drizzle client
```

- **Repositories** exist for the tables with real query complexity (events, tasks, people — filtering/search/sort/pagination). Simpler resources (comments, notes, tags, checklist items) skip a dedicated repository file and query Drizzle directly from their service — a deliberate choice to avoid a pass-through layer that adds ceremony without value for 1:1 CRUD.
- **`activityLogService.record(...)`** is the single write path for the activity log, called only from services (never routes), so the global Recent Activity feed and each event's Timeline tab can never silently miss an entry.
- **Email** (`server/src/services/email/`): an `EmailService` interface with a `ConsoleTransport` default (logs + writes an `email_logs` row). Swapping in real SMTP later means adding a `NodemailerTransport` implementing the same interface and flipping `EMAIL_TRANSPORT` — zero call-site changes.
- **AI seam** (`server/src/services/ai/`): an `AiProvider` interface with only a `NoopAiProvider` implementation in Phase 1 (its `generateChecklist` just returns the default/template checklist — same output as "no AI"). The seam is exercised end-to-end without ever calling an LLM.

## Frontend

- **Server state**: TanStack Query. One hooks file per domain under `client/src/features/<domain>/`, built on a shared typed `lib/api.ts` fetch wrapper. Query keys centralized in `lib/queryKeys.ts`.
- **UI/client state**: Zustand, for pure UI chrome only (sidebar, theme/accent, command palette) — list filters live in the URL (`useSearchParams`) so they're shareable and back-button-friendly.
- **Design system**: Tailwind v4 + hand-authored shadcn/ui-style components (Radix primitives + `class-variance-authority`), theme tokens as CSS variables in `styles/index.css`, light-first with a `.dark` class override.
- **Routing**: `react-router-dom` `createBrowserRouter`, all pages lazy-loaded, everything behind `ProtectedRoute` except `/login` and `/signup`.
- **PWA**: `vite-plugin-pwa`, installable via Chrome's "Install app" prompt (requires HTTPS in production; exempt on localhost).

## Auth

Single-admin, personal-use auth — no external identity provider, no sign-up. `server/src/services/authService.ts` checks the submitted email/password against `ADMIN_EMAIL`/`ADMIN_PASSWORD` (env vars, compared with `crypto.timingSafeEqual`), and on success upserts the one `app_users` row (matched by email) and signs a JWT (`jsonwebtoken`, secret from `JWT_SECRET`). `server/src/middleware/auth.ts` verifies that JWT on every other route. The client (`client/src/auth/AuthProvider.tsx`) posts to `/auth/login`, stores the token in `localStorage`, and attaches it to every API call; on load it revalidates the stored token against `GET /auth/session`.

This intentionally does not scale to multiple users — see [`ROADMAP.md`](ROADMAP.md) for what real multi-user auth (and the sharing/permissions it would unlock) would take later. The schema-only `permissions` table already anticipates it.
