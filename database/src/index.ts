import * as schema from './schema';
import { Table } from './table';
import type {
  ActivityLog,
  AppSetting,
  AppUser,
  Attachment,
  ChecklistItem,
  ChecklistTemplate,
  Comment,
  EmailLog,
  Event,
  EventAttendanceRow,
  EventPerson,
  EventTag,
  Note,
  Notification,
  Permission,
  Person,
  Tag,
  Task,
  TaskAssignee,
  TaskDependency,
  TaskTag,
  TemplateItem,
} from './types';

/**
 * The data layer. One `Table` per DynamoDB table, addressed by the same names
 * the SQL schema used: `db.events`, `db.taskAssignees`, and so on.
 */
export const db = {
  appUsers: new Table<AppUser>(schema.appUsers),
  events: new Table<Event>(schema.events),
  tasks: new Table<Task>(schema.tasks),
  people: new Table<Person>(schema.people),
  eventPeople: new Table<EventPerson>(schema.eventPeople),
  eventAttendance: new Table<EventAttendanceRow>(schema.eventAttendance),
  taskAssignees: new Table<TaskAssignee>(schema.taskAssignees),
  taskDependencies: new Table<TaskDependency>(schema.taskDependencies),
  checklistItems: new Table<ChecklistItem>(schema.checklistItems),
  checklistTemplates: new Table<ChecklistTemplate>(schema.checklistTemplates),
  templateItems: new Table<TemplateItem>(schema.templateItems),
  comments: new Table<Comment>(schema.comments),
  attachments: new Table<Attachment>(schema.attachments),
  notes: new Table<Note>(schema.notes),
  tags: new Table<Tag>(schema.tags),
  eventTags: new Table<EventTag>(schema.eventTags),
  taskTags: new Table<TaskTag>(schema.taskTags),
  activityLogs: new Table<ActivityLog>(schema.activityLogs),
  emailLogs: new Table<EmailLog>(schema.emailLogs),
  notifications: new Table<Notification>(schema.notifications),
  permissions: new Table<Permission>(schema.permissions),
  appSettings: new Table<AppSetting>(schema.appSettings),
} as const;

export type Database = typeof db;

/** Index names, so call sites reference them without stringly-typed literals. */
export const INDEXES = {
  appUsersByEmail: 'app_users_email_idx',
  tasksByEvent: 'tasks_event_id_idx',
  eventPeopleByPerson: 'event_people_person_idx',
  taskAssigneesByPerson: 'task_assignees_person_idx',
  eventAttendanceByPerson: 'event_attendance_person_idx',
  checklistItemsByEvent: 'checklist_items_event_id_idx',
  checklistItemsByTask: 'checklist_items_task_id_idx',
  templateItemsByTemplate: 'template_items_template_id_idx',
  commentsByEvent: 'comments_event_id_idx',
  commentsByTask: 'comments_task_id_idx',
  attachmentsByEvent: 'attachments_event_id_idx',
  attachmentsByTask: 'attachments_task_id_idx',
  notesByEvent: 'notes_event_id_idx',
  tagsByName: 'tags_name_idx',
  eventTagsByTag: 'event_tags_tag_id_idx',
  taskTagsByTag: 'task_tags_tag_id_idx',
  activityLogsByEvent: 'activity_logs_event_id_idx',
  notificationsByUser: 'notifications_user_id_idx',
} as const;

export { schema };
export * from './client';
export * from './table';
export * from './types';
export { TABLES } from './schema';
export type { ColumnDef, IndexDef, TableDef, TableKey } from './schema';
