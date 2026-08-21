# Roadmap: Phase 2+

Everything below is deliberately **not** built yet. The architecture was kept additive on purpose — none of these require rearchitecting what exists.

- **Real SMTP wiring.** The `EmailService` interface, `email_logs` table, and trigger call-sites already exist (`server/src/services/email/`). Add a `NodemailerTransport` implementing `EmailTransport`, flip `EMAIL_TRANSPORT=smtp`, done.
- **Real multi-user auth + sharing / permissions.** Today there's exactly one admin account, credentials in env vars, no sign-up. The `permissions` table exists as a schema-only placeholder (`subjectEmail`, `eventId`, `level`: Viewer/Editor/Manager/Owner) but isn't wired to any route middleware. Real multi-user support would mean a proper `app_users` table with hashed per-user passwords (or an external IdP), a sign-up/invite flow, and enforcing `level` in the `auth` middleware per-route.
- **Real AI features.** `server/src/services/ai/AiProvider` interface exists; only `NoopAiProvider` is implemented. A real provider (checklist generation, missing-task suggestions, proposal drafts, agenda generation, deadline-risk flags, natural-language search, progress summaries, dashboard insights) implements the same interface.
- **Report export** (PDF/Excel/CSV). Reports currently render on-screen JSON only (`/reports/*`).
- **Generic no-code custom-fields engine** for events/tasks/people. A real sub-project on its own (EAV or JSONB-based), not started.
- **Native mobile app.** The PWA (installable via Chrome, `vite-plugin-pwa`) covers "install like an app" for Phase 1; a true Flutter/React Native app is separate.
- **Offline data sync.** The current service worker caches the app shell/static assets, not full offline CRUD with background sync.
- **Cloud storage for attachments.** Local disk (`server/uploads/`) in Phase 1; swap to S3 behind the same upload/download interface later.
- **WhatsApp/Telegram notification channels.**
- **Voice commands.**
- **Full-text search.** Current search scans the table and substring-matches in the service layer (`lib/query.ts`), which is what DynamoDB leaves you for non-key predicates. Front it with OpenSearch — or DynamoDB Streams into an inverted-index table — if it ever feels slow at real scale.
- **A literal `month_settings(year, month)` table** — only if a genuine per-month attribute (e.g. a monthly budget cap) is ever needed. Until then, month/year is always derived from `events.date`.
- **Final AWS architecture** (EC2+RDS vs ECS Fargate) — both are documented as options in `AWS.md`; nothing forces the choice yet since the server is deployment-agnostic.
- **Infrastructure as code** (CDK/Terraform/CloudFormation) and a CI/CD pipeline.
