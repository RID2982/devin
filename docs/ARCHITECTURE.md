# Architecture

## Monorepo

npm workspaces: `client/`, `server/`, `database/`, `shared/`. `shared/` exports TypeScript source directly (no build step needed in dev — both Vite and `tsx` transpile TS natively); `database/` exports the DynamoDB table definitions and a ready-to-use `db` client so the server never touches the AWS SDK directly.

## Data model

No literal `Month` table. Month/year is always derived from `events.date` (an ISO-8601 timestamp) — the Monthly Planner buckets events by year/month in the service layer off one table read. A `month_settings(year, month)` table is a one-line addition later if a real per-month attribute (e.g. a monthly budget cap) is ever needed — nothing in the current design blocks it.

Archive, never delete. Archivable tables (`events`, `tasks`, `people`, `notes`) carry a nullable `archivedAt`. Default queries filter it out; the Archive page queries the inverse; restoring clears it. The UI never hard-deletes user-generated content.

See `database/src/schema.ts` for the full table list (22 tables) — events, tasks, people, join tables for assignments/dependencies/tags, checklist items + templates, comments, attachments, notes, activity logs, email logs, notifications, a schema-only `permissions` placeholder for future sharing, and `app_users` (the single admin account row).

## DynamoDB design

**One table per entity, not single-table design.** The idiomatic DynamoDB move is to put every entity in one table behind a composite `PK`/`SK`. This app doesn't, deliberately: single-table design pays off when access patterns are known, fixed, and high-volume, and this app's are the opposite — an admin UI that filters and sorts by whatever column the user clicked, over one club's worth of data. Table-per-entity keeps the schema legible, keeps each table's keys meaningful, and left the service layer recognisable through the port.

**Keys.** Entity tables are keyed by `id`. The pure join tables (`event_people`, `task_assignees`, `event_attendance`, `task_dependencies`, `event_tags`, `task_tags`) are keyed by the *pair* instead — which is what turns "add this person to the event, ignore if already there" into one conditional `PutItem`, and what the unique index on those pairs was doing under SQL. Secondary indexes exist only where something is genuinely fetched by a foreign key (`tasks` by event, `comments` by event/task, `activity_logs` by event + time, …); everything else reads the table.

**Filtering, sorting, paging happen in the service layer** (`server/src/lib/query.ts`). DynamoDB can Query a key or Scan; it cannot do `ILIKE`, arbitrary `ORDER BY`, or `OFFSET`. So the repositories fetch and narrow in memory, reproducing the SQL semantics the UI was built against — case-insensitive substring search, `NULL`s last ascending and first descending, and enum columns sorting in *declaration* order (`Low < Medium < High < Critical`), not alphabetically, exactly as a `pgEnum` did. This is the deliberate cost of the move: it's correct and fast at one club's scale, and the note in [`ROADMAP.md`](ROADMAP.md) covers what to do if the data ever outgrows it.

**Two impedance mismatches are handled once, in `database/src/table.ts`**, so no service has to think about them:
- *Dates.* Stored as ISO-8601 strings (so they sort correctly as range keys), returned as `Date` objects — what `pg` gave, and what the dashboard's date arithmetic expects.
- *Absent vs null.* DynamoDB omits an attribute; `SELECT *` always produced the column holding `null`. Reads re-fill every declared column, so `event.budget === null` still means what it meant. Writes go the other way for index keys, which DynamoDB rejects if typed `NULL`, so those are omitted instead — an unindexed item, which is the same thing a partial index gave you.

**No foreign keys, so no cascades.** `ON DELETE CASCADE` has no DynamoDB equivalent. In practice the app archives rather than deletes, and the one real cascade — archiving an event archives its tasks — is now explicit in `eventsService`. `UpdateItem` would also happily *insert* an item that `UPDATE ... WHERE id = ?` would have simply not matched, so `Table.update` carries an `attribute_exists` condition and returns undefined instead, preserving the 404s the callers were written to produce.

## Backend layering

```
routes -> auth middleware (JWT) -> zod validators -> controllers (thin) -> services (business rules) -> repositories (Query/Scan + in-memory narrowing) -> DynamoDB DocumentClient
```

- **Repositories** exist for the tables with real query complexity (events, tasks, people — filtering/search/sort/pagination). Simpler resources (comments, notes, tags, checklist items) skip a dedicated repository file and use the `db.<table>` client directly from their service — a deliberate choice to avoid a pass-through layer that adds ceremony without value for 1:1 CRUD.
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
