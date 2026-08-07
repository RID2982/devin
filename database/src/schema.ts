import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  ACTIVITY_ACTIONS,
  EMAIL_STATUSES,
  EVENT_STATUSES,
  NOTIFICATION_TYPES,
  PERMISSION_LEVELS,
  PRIORITIES,
  TASK_STATUSES,
} from '@app/shared';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const eventStatusEnum = pgEnum('event_status', [...EVENT_STATUSES]);
export const taskStatusEnum = pgEnum('task_status', [...TASK_STATUSES]);
export const priorityEnum = pgEnum('priority', [...PRIORITIES]);
export const emailStatusEnum = pgEnum('email_status', [...EMAIL_STATUSES]);
export const notificationTypeEnum = pgEnum('notification_type', [...NOTIFICATION_TYPES]);
export const permissionLevelEnum = pgEnum('permission_level', [...PERMISSION_LEVELS]);
export const activityActionEnum = pgEnum('activity_action', [...ACTIVITY_ACTIONS]);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

// ---------------------------------------------------------------------------
// Auth / Users
// ---------------------------------------------------------------------------
// Single-admin auth: there is exactly one row here, matched by ADMIN_EMAIL at
// login time. No external identity provider — see server/src/services/authService.ts.
export const appUsers = pgTable('app_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex('app_users_email_idx').on(t.email),
}));

// ---------------------------------------------------------------------------
// Core: Events / Tasks / People
// ---------------------------------------------------------------------------
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  time: varchar('time', { length: 20 }),
  venue: varchar('venue', { length: 255 }),
  budget: numeric('budget', { precision: 12, scale: 2 }),
  expenses: jsonb('expenses').default([]),
  status: eventStatusEnum('status').notNull().default('Planning'),
  priority: priorityEnum('priority').notNull().default('Medium'),
  color: varchar('color', { length: 20 }).default('#b42244'),
  description: text('description'),
  coverImagePath: text('cover_image_path'),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  ...timestamps,
}, (t) => ({
  dateIdx: index('events_date_idx').on(t.date),
  statusIdx: index('events_status_idx').on(t.status),
  archivedIdx: index('events_archived_idx').on(t.archivedAt),
}));

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  deadline: timestamp('deadline', { withTimezone: true }),
  priority: priorityEnum('priority').notNull().default('Medium'),
  status: taskStatusEnum('status').notNull().default('Pending'),
  estimatedMinutes: integer('estimated_minutes'),
  actualMinutes: integer('actual_minutes'),
  order: integer('order').notNull().default(0),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  ...timestamps,
}, (t) => ({
  deadlineIdx: index('tasks_deadline_idx').on(t.deadline),
  statusIdx: index('tasks_status_idx').on(t.status),
  eventIdx: index('tasks_event_id_idx').on(t.eventId),
}));

export const people = pgTable('people', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 40 }),
  role: varchar('role', { length: 120 }),
  department: varchar('department', { length: 120 }),
  organization: varchar('organization', { length: 255 }),
  skills: text('skills').array(),
  avatarPath: text('avatar_path'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Join tables
// ---------------------------------------------------------------------------
export const eventPeople = pgTable('event_people', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  roleOnEvent: varchar('role_on_event', { length: 120 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('event_people_event_person_idx').on(t.eventId, t.personId),
}));

export const taskAssignees = pgTable('task_assignees', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex('task_assignees_task_person_idx').on(t.taskId, t.personId),
}));

export const taskDependencies = pgTable('task_dependencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  dependsOnTaskId: uuid('depends_on_task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
}, (t) => ({
  uniq: uniqueIndex('task_dependencies_task_depends_idx').on(t.taskId, t.dependsOnTaskId),
}));

// ---------------------------------------------------------------------------
// Checklists & Templates
// ---------------------------------------------------------------------------
export const checklistItems = pgTable('checklist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: varchar('label', { length: 255 }).notNull(),
  isDone: boolean('is_done').notNull().default(false),
  order: integer('order').notNull().default(0),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  ...timestamps,
}, (t) => ({
  eventIdx: index('checklist_items_event_id_idx').on(t.eventId),
  taskIdx: index('checklist_items_task_id_idx').on(t.taskId),
}));

export const checklistTemplates = pgTable('checklist_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  isBuiltIn: boolean('is_built_in').notNull().default(false),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  ...timestamps,
});

export const templateItems = pgTable('template_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => checklistTemplates.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 255 }).notNull(),
  order: integer('order').notNull().default(0),
});

// ---------------------------------------------------------------------------
// Comments / Attachments / Notes / Tags
// ---------------------------------------------------------------------------
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  body: text('body').notNull(),
  authorUserId: uuid('author_user_id').references(() => appUsers.id, { onDelete: 'set null' }),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  ...timestamps,
});

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: varchar('filename', { length: 500 }).notNull(),
  storedPath: text('stored_path').notNull(),
  mimeType: varchar('mime_type', { length: 150 }),
  sizeBytes: integer('size_bytes'),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  uploadedByUserId: uuid('uploaded_by_user_id').references(() => appUsers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }),
  bodyMarkdown: text('body_markdown').notNull().default(''),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  ...timestamps,
});

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 20 }),
}, (t) => ({
  nameIdx: uniqueIndex('tags_name_idx').on(t.name),
}));

export const eventTags = pgTable('event_tags', {
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.eventId, t.tagId] }),
}));

export const taskTags = pgTable('task_tags', {
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.taskId, t.tagId] }),
}));

// ---------------------------------------------------------------------------
// Activity / Email / Notifications / Permissions / Settings
// ---------------------------------------------------------------------------
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: activityActionEnum('action').notNull(),
  summary: text('summary').notNull(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  actorUserId: uuid('actor_user_id').references(() => appUsers.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  createdIdx: index('activity_logs_created_at_idx').on(t.createdAt),
  eventIdx: index('activity_logs_event_id_idx').on(t.eventId),
}));

export const emailLogs = pgTable('email_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  to: varchar('to', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  templateKey: varchar('template_key', { length: 100 }).notNull(),
  payload: jsonb('payload'),
  status: emailStatusEnum('status').notNull().default('Stubbed'),
  transport: varchar('transport', { length: 50 }).notNull().default('console'),
  relatedEventId: uuid('related_event_id').references(() => events.id, { onDelete: 'set null' }),
  relatedTaskId: uuid('related_task_id').references(() => tasks.id, { onDelete: 'set null' }),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => appUsers.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body'),
  isRead: boolean('is_read').notNull().default(false),
  relatedEventId: uuid('related_event_id').references(() => events.id, { onDelete: 'set null' }),
  relatedTaskId: uuid('related_task_id').references(() => tasks.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Schema-only placeholder for Phase 2+ sharing; not wired to any route/middleware yet.
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  subjectEmail: varchar('subject_email', { length: 255 }).notNull(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
  level: permissionLevelEnum('level').notNull().default('Viewer'),
  invitedAt: timestamp('invited_at', { withTimezone: true }).notNull().defaultNow(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
});

export const appSettings = pgTable('app_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations (for Drizzle's relational query API)
// ---------------------------------------------------------------------------
export const eventsRelations = relations(events, ({ many }) => ({
  tasks: many(tasks),
  checklistItems: many(checklistItems),
  attachments: many(attachments),
  notes: many(notes),
  comments: many(comments),
  activityLogs: many(activityLogs),
  eventPeople: many(eventPeople),
  eventTags: many(eventTags),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  event: one(events, { fields: [tasks.eventId], references: [events.id] }),
  assignees: many(taskAssignees),
  checklistItems: many(checklistItems),
  attachments: many(attachments),
  comments: many(comments),
  taskTags: many(taskTags),
}));

export const peopleRelations = relations(people, ({ many }) => ({
  eventAssignments: many(eventPeople),
  taskAssignments: many(taskAssignees),
}));

export const eventPeopleRelations = relations(eventPeople, ({ one }) => ({
  event: one(events, { fields: [eventPeople.eventId], references: [events.id] }),
  person: one(people, { fields: [eventPeople.personId], references: [people.id] }),
}));

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, { fields: [taskAssignees.taskId], references: [tasks.id] }),
  person: one(people, { fields: [taskAssignees.personId], references: [people.id] }),
}));

export const checklistTemplatesRelations = relations(checklistTemplates, ({ many }) => ({
  items: many(templateItems),
}));

export const templateItemsRelations = relations(templateItems, ({ one }) => ({
  template: one(checklistTemplates, { fields: [templateItems.templateId], references: [checklistTemplates.id] }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  eventTags: many(eventTags),
  taskTags: many(taskTags),
}));
