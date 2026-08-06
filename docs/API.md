# API Reference

Base path: `/api/v1`. Every route except `GET /health` and `POST /auth/login` requires `Authorization: Bearer <token>` obtained from `POST /auth/login`.

List endpoints share these query conventions: `page`, `pageSize` (envelope `{ data, meta: { page, pageSize, total, totalPages } }`), `sortBy`, `sortDir` (`asc`|`desc`), `search`, `archived` (`true` to see archived rows instead of active ones), plus resource-specific filters below.

## Auth
- `POST /auth/login` — **public**, no token required. Body: `{ email, password }`, checked against `ADMIN_EMAIL`/`ADMIN_PASSWORD`. Returns `{ token, user }` on success.
- `GET /auth/session` — verifies the token, returns the current (single) admin user.

## Events
- `GET /events` — filters: `status`, `priority`, `category`, `month` (`YYYY-MM`)
- `POST /events` — body includes optional `templateId` to seed the checklist from a template instead of the default 30-item list
- `GET|PATCH /events/:id`
- `DELETE /events/:id` — archive (soft delete)
- `POST /events/:id/restore`
- `POST /events/:id/apply-template/:templateId`
- `GET /events/:id/timeline` — activity log for this event
- `GET /events/:id/summary` — checklist/task completion rollup
- `POST|DELETE /events/:id/people/:personId`
- `POST|DELETE /events/:id/tags/:tagId`

## Tasks
- `GET /tasks` — filters: `status`, `priority`, `eventId`
- `POST /tasks` — `eventId` required
- `GET|PATCH /tasks/:id`
- `PATCH /tasks/:id/status` — cheap endpoint for Kanban drag / quick toggles
- `DELETE /tasks/:id` / `POST /tasks/:id/restore`
- `POST|DELETE /tasks/:id/assignees/:personId`
- `POST|DELETE /tasks/:id/dependencies/:dependsOnId`
- `POST|DELETE /tasks/:id/tags/:tagId`

## People
- `GET|POST /people`, `GET|PATCH /people/:id`, `DELETE /people/:id` (archive), `POST /people/:id/restore`

## Checklist items
- `GET /checklist-items?eventId=` or `?taskId=`
- `POST /checklist-items` — body: `label` + exactly one of `eventId`/`taskId`
- `PATCH /checklist-items/:id` — `label`, `isDone`, `order`
- `PATCH /checklist-items/reorder` — body: `{ items: [{ id, order }] }`
- `DELETE /checklist-items/:id`

## Templates
- `GET|POST /templates`, `GET|PATCH /templates/:id`, `DELETE /templates/:id` (archive)
- `POST /templates/:id/items`, `DELETE /templates/:id/items/:itemId`

## Comments / Notes / Attachments
- `GET|POST /comments?eventId=`/`?taskId=`, `PATCH|DELETE /comments/:id`
- `GET|POST /notes?eventId=`, `PATCH /notes/:id` (autosave target), `DELETE /notes/:id`
- `GET /attachments?eventId=`/`?taskId=`, `POST /attachments` (multipart, field `file`), `GET /attachments/:id/download`, `DELETE /attachments/:id`

## Tags
- `GET|POST /tags`

## Activity / Notifications
- `GET /activity?eventId=` — global feed or per-event
- `GET /notifications`, `PATCH /notifications/:id/read`

## Aggregate / cross-cutting
- `GET /dashboard/overview` — all 8 stat cards + every dashboard widget in one call
- `GET /planner/:year` — events pre-bucketed by month
- `GET /calendar?from=&to=` — events + task deadlines in an ISO date range
- `GET /search?q=` — cross-entity (events/tasks/people)
- `GET /attention` — overdue, high-priority, upcoming-deadline, unassigned, incomplete-checklist, missing-document, and budget-pending buckets
- `GET /reports/monthly?month=YYYY-MM`, `GET /reports/event-summary/:eventId`, `GET /reports/productivity` — on-screen JSON only; file export (PDF/Excel/CSV) is a Phase 2 item
- `GET|PATCH /settings` — key/value app settings (theme, accent color, notification preferences, archive rules)

## Error shape

```json
{ "error": { "code": "NOT_FOUND", "message": "Event (uuid) not found", "details": null } }
```
