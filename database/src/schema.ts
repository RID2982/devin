import {
  ACTIVITY_ACTIONS,
  ATTENDANCE_STATUSES,
  EMAIL_STATUSES,
  EVENT_STATUSES,
  NOTIFICATION_TYPES,
  PERMISSION_LEVELS,
  PRIORITIES,
  TASK_STATUSES,
} from '@app/shared';

// ---------------------------------------------------------------------------
// Table definitions
// ---------------------------------------------------------------------------
// One DynamoDB table per entity, named exactly like the SQL tables this replaced
// (optionally prefixed via DYNAMODB_TABLE_PREFIX, since DynamoDB table names are
// account+region global). Attributes keep the camelCase names the API already
// returns, so nothing downstream of the repositories changed shape.
//
// `columns` is the full column list: it drives defaults on write and null-filling
// on read, so every item comes back with every attribute present — the same row
// shape `SELECT *` used to produce.

export type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'json' | 'list';

export interface ColumnDef {
  type: ColumnType;
  /** Value used when a column is omitted on create. A function is called per row. */
  default?: unknown | (() => unknown);
  /** Documents the allowed values for what used to be a Postgres enum. */
  enum?: readonly string[];
}

export interface IndexDef {
  name: string;
  hashKey: string;
  rangeKey?: string;
}

export interface TableDef {
  /** Physical table name, before DYNAMODB_TABLE_PREFIX is applied. */
  name: string;
  hashKey: string;
  rangeKey?: string;
  columns: Record<string, ColumnDef>;
  indexes?: IndexDef[];
}

const uuid = (): ColumnDef => ({ type: 'string', default: () => crypto.randomUUID() });
const now = (): ColumnDef => ({ type: 'date', default: () => new Date() });
const timestamps = { createdAt: now(), updatedAt: now() };

function defineTable<const T extends TableDef>(def: T): T {
  return def;
}

// ---------------------------------------------------------------------------
// Auth / Users
// ---------------------------------------------------------------------------
// Single-admin auth: there is exactly one item here, matched by ADMIN_EMAIL at
// login time. No external identity provider — see server/src/services/authService.ts.
export const appUsers = defineTable({
  name: 'app_users',
  hashKey: 'id',
  columns: {
    id: uuid(),
    email: { type: 'string' },
    name: { type: 'string' },
    createdAt: now(),
  },
  indexes: [{ name: 'app_users_email_idx', hashKey: 'email' }],
});

// ---------------------------------------------------------------------------
// Core: Events / Tasks / People
// ---------------------------------------------------------------------------
export const events = defineTable({
  name: 'events',
  hashKey: 'id',
  columns: {
    id: uuid(),
    name: { type: 'string' },
    category: { type: 'string' },
    date: { type: 'date' },
    endDate: { type: 'date' },
    time: { type: 'string' },
    venue: { type: 'string' },
    // Stored as a string, exactly like pg's numeric(12,2) came back over the wire.
    budget: { type: 'string' },
    expenses: { type: 'json', default: () => [] },
    status: { type: 'string', default: 'Planning', enum: EVENT_STATUSES },
    priority: { type: 'string', default: 'Medium', enum: PRIORITIES },
    color: { type: 'string', default: '#b42244' },
    description: { type: 'string' },
    coverImagePath: { type: 'string' },
    archivedAt: { type: 'date' },
    ...timestamps,
  },
});

export const tasks = defineTable({
  name: 'tasks',
  hashKey: 'id',
  columns: {
    id: uuid(),
    eventId: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    deadline: { type: 'date' },
    priority: { type: 'string', default: 'Medium', enum: PRIORITIES },
    status: { type: 'string', default: 'Pending', enum: TASK_STATUSES },
    estimatedMinutes: { type: 'number' },
    actualMinutes: { type: 'number' },
    order: { type: 'number', default: 0 },
    archivedAt: { type: 'date' },
    ...timestamps,
  },
  indexes: [{ name: 'tasks_event_id_idx', hashKey: 'eventId' }],
});

export const people = defineTable({
  name: 'people',
  hashKey: 'id',
  columns: {
    id: uuid(),
    name: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string' },
    role: { type: 'string' },
    department: { type: 'string' },
    organization: { type: 'string' },
    skills: { type: 'list' },
    avatarPath: { type: 'string' },
    notes: { type: 'string' },
    isActive: { type: 'boolean', default: true },
    archivedAt: { type: 'date' },
    ...timestamps,
  },
});

// ---------------------------------------------------------------------------
// Join tables
// ---------------------------------------------------------------------------
// These carried a surrogate uuid `id` plus a unique index on the pair under
// Postgres. Here the pair *is* the primary key, which is what makes the
// "insert, ignore if it already exists" writes a single conditional call.
// `id` is still stored so rows imported from Postgres keep their identity.
export const eventPeople = defineTable({
  name: 'event_people',
  hashKey: 'eventId',
  rangeKey: 'personId',
  columns: {
    id: uuid(),
    eventId: { type: 'string' },
    personId: { type: 'string' },
    roleOnEvent: { type: 'string' },
    createdAt: now(),
  },
  indexes: [{ name: 'event_people_person_idx', hashKey: 'personId' }],
});

export const taskAssignees = defineTable({
  name: 'task_assignees',
  hashKey: 'taskId',
  rangeKey: 'personId',
  columns: {
    id: uuid(),
    taskId: { type: 'string' },
    personId: { type: 'string' },
    assignedAt: now(),
  },
  indexes: [{ name: 'task_assignees_person_idx', hashKey: 'personId' }],
});

export const eventAttendance = defineTable({
  name: 'event_attendance',
  hashKey: 'eventId',
  rangeKey: 'personId',
  columns: {
    id: uuid(),
    eventId: { type: 'string' },
    personId: { type: 'string' },
    status: { type: 'string', default: 'Absent', enum: ATTENDANCE_STATUSES },
    markedAt: { type: 'date' },
    markedByUserId: { type: 'string' },
    ...timestamps,
  },
  indexes: [{ name: 'event_attendance_person_idx', hashKey: 'personId' }],
});

export const taskDependencies = defineTable({
  name: 'task_dependencies',
  hashKey: 'taskId',
  rangeKey: 'dependsOnTaskId',
  columns: {
    id: uuid(),
    taskId: { type: 'string' },
    dependsOnTaskId: { type: 'string' },
  },
});

// ---------------------------------------------------------------------------
// Checklists & Templates
// ---------------------------------------------------------------------------
export const checklistItems = defineTable({
  name: 'checklist_items',
  hashKey: 'id',
  columns: {
    id: uuid(),
    label: { type: 'string' },
    isDone: { type: 'boolean', default: false },
    order: { type: 'number', default: 0 },
    eventId: { type: 'string' },
    taskId: { type: 'string' },
    completedAt: { type: 'date' },
    ...timestamps,
  },
  indexes: [
    { name: 'checklist_items_event_id_idx', hashKey: 'eventId' },
    { name: 'checklist_items_task_id_idx', hashKey: 'taskId' },
  ],
});

export const checklistTemplates = defineTable({
  name: 'checklist_templates',
  hashKey: 'id',
  columns: {
    id: uuid(),
    name: { type: 'string' },
    description: { type: 'string' },
    category: { type: 'string' },
    isBuiltIn: { type: 'boolean', default: false },
    archivedAt: { type: 'date' },
    ...timestamps,
  },
});

export const templateItems = defineTable({
  name: 'template_items',
  hashKey: 'id',
  columns: {
    id: uuid(),
    templateId: { type: 'string' },
    label: { type: 'string' },
    order: { type: 'number', default: 0 },
  },
  indexes: [{ name: 'template_items_template_id_idx', hashKey: 'templateId' }],
});

// ---------------------------------------------------------------------------
// Comments / Attachments / Notes / Tags
// ---------------------------------------------------------------------------
export const comments = defineTable({
  name: 'comments',
  hashKey: 'id',
  columns: {
    id: uuid(),
    body: { type: 'string' },
    authorUserId: { type: 'string' },
    eventId: { type: 'string' },
    taskId: { type: 'string' },
    ...timestamps,
  },
  indexes: [
    { name: 'comments_event_id_idx', hashKey: 'eventId' },
    { name: 'comments_task_id_idx', hashKey: 'taskId' },
  ],
});

export const attachments = defineTable({
  name: 'attachments',
  hashKey: 'id',
  columns: {
    id: uuid(),
    filename: { type: 'string' },
    storedPath: { type: 'string' },
    mimeType: { type: 'string' },
    sizeBytes: { type: 'number' },
    eventId: { type: 'string' },
    taskId: { type: 'string' },
    uploadedByUserId: { type: 'string' },
    createdAt: now(),
  },
  indexes: [
    { name: 'attachments_event_id_idx', hashKey: 'eventId' },
    { name: 'attachments_task_id_idx', hashKey: 'taskId' },
  ],
});

export const notes = defineTable({
  name: 'notes',
  hashKey: 'id',
  columns: {
    id: uuid(),
    title: { type: 'string' },
    bodyMarkdown: { type: 'string', default: '' },
    eventId: { type: 'string' },
    archivedAt: { type: 'date' },
    ...timestamps,
  },
  indexes: [{ name: 'notes_event_id_idx', hashKey: 'eventId' }],
});

export const tags = defineTable({
  name: 'tags',
  hashKey: 'id',
  columns: {
    id: uuid(),
    name: { type: 'string' },
    color: { type: 'string' },
  },
  indexes: [{ name: 'tags_name_idx', hashKey: 'name' }],
});

export const eventTags = defineTable({
  name: 'event_tags',
  hashKey: 'eventId',
  rangeKey: 'tagId',
  columns: {
    eventId: { type: 'string' },
    tagId: { type: 'string' },
  },
  indexes: [{ name: 'event_tags_tag_id_idx', hashKey: 'tagId' }],
});

export const taskTags = defineTable({
  name: 'task_tags',
  hashKey: 'taskId',
  rangeKey: 'tagId',
  columns: {
    taskId: { type: 'string' },
    tagId: { type: 'string' },
  },
  indexes: [{ name: 'task_tags_tag_id_idx', hashKey: 'tagId' }],
});

// ---------------------------------------------------------------------------
// Activity / Email / Notifications / Permissions / Settings
// ---------------------------------------------------------------------------
export const activityLogs = defineTable({
  name: 'activity_logs',
  hashKey: 'id',
  columns: {
    id: uuid(),
    action: { type: 'string', enum: ACTIVITY_ACTIONS },
    summary: { type: 'string' },
    eventId: { type: 'string' },
    taskId: { type: 'string' },
    actorUserId: { type: 'string' },
    metadata: { type: 'json' },
    createdAt: now(),
  },
  // createdAt as the range key makes "this event's timeline, newest first" a
  // single reverse Query instead of a scan-and-sort.
  indexes: [{ name: 'activity_logs_event_id_idx', hashKey: 'eventId', rangeKey: 'createdAt' }],
});

export const emailLogs = defineTable({
  name: 'email_logs',
  hashKey: 'id',
  columns: {
    id: uuid(),
    to: { type: 'string' },
    subject: { type: 'string' },
    templateKey: { type: 'string' },
    payload: { type: 'json' },
    status: { type: 'string', default: 'Stubbed', enum: EMAIL_STATUSES },
    transport: { type: 'string', default: 'console' },
    relatedEventId: { type: 'string' },
    relatedTaskId: { type: 'string' },
    sentAt: now(),
  },
});

export const notifications = defineTable({
  name: 'notifications',
  hashKey: 'id',
  columns: {
    id: uuid(),
    userId: { type: 'string' },
    type: { type: 'string', enum: NOTIFICATION_TYPES },
    title: { type: 'string' },
    body: { type: 'string' },
    isRead: { type: 'boolean', default: false },
    relatedEventId: { type: 'string' },
    relatedTaskId: { type: 'string' },
    createdAt: now(),
  },
  indexes: [{ name: 'notifications_user_id_idx', hashKey: 'userId', rangeKey: 'createdAt' }],
});

// Schema-only placeholder for Phase 2+ sharing; not wired to any route/middleware yet.
export const permissions = defineTable({
  name: 'permissions',
  hashKey: 'id',
  columns: {
    id: uuid(),
    subjectEmail: { type: 'string' },
    eventId: { type: 'string' },
    level: { type: 'string', default: 'Viewer', enum: PERMISSION_LEVELS },
    invitedAt: now(),
    acceptedAt: { type: 'date' },
  },
});

export const appSettings = defineTable({
  name: 'app_settings',
  hashKey: 'key',
  columns: {
    key: { type: 'string' },
    value: { type: 'json' },
    updatedAt: now(),
  },
});

/**
 * Every table in the app, keyed by the name the repositories use. Iteration order
 * is the safe creation/import order — parents before the items that reference them.
 */
export const TABLES = {
  appUsers,
  events,
  tasks,
  people,
  eventPeople,
  eventAttendance,
  taskAssignees,
  taskDependencies,
  checklistItems,
  checklistTemplates,
  templateItems,
  comments,
  attachments,
  notes,
  tags,
  eventTags,
  taskTags,
  activityLogs,
  emailLogs,
  notifications,
  permissions,
  appSettings,
} as const;

export type TableKey = keyof typeof TABLES;
