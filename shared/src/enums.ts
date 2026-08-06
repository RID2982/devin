export const EVENT_STATUSES = ['Planning', 'InProgress', 'Completed', 'Cancelled', 'OnHold'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const TASK_STATUSES = ['Pending', 'InProgress', 'Completed', 'Blocked', 'Cancelled'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const EMAIL_STATUSES = ['Sent', 'Failed', 'Stubbed'] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

export const PERMISSION_LEVELS = ['Viewer', 'Editor', 'Manager', 'Owner'] as const;
export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];

export const ACTIVITY_ACTIONS = [
  'EVENT_CREATED',
  'EVENT_UPDATED',
  'EVENT_ARCHIVED',
  'EVENT_RESTORED',
  'TASK_CREATED',
  'TASK_UPDATED',
  'TASK_COMPLETED',
  'TASK_STATUS_CHANGED',
  'TASK_ASSIGNED',
  'CHECKLIST_ITEM_ADDED',
  'CHECKLIST_ITEM_DONE',
  'CHECKLIST_APPLIED_TEMPLATE',
  'FILE_UPLOADED',
  'COMMENT_ADDED',
  'PERSON_ASSIGNED',
  'NOTE_UPDATED',
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const NOTIFICATION_TYPES = [
  'TASK_ASSIGNED',
  'TASK_COMPLETED',
  'DEADLINE_TOMORROW',
  'DEADLINE_TODAY',
  'EVENT_CREATED',
  'EVENT_UPDATED',
  'EVENT_CANCELLED',
  'NEW_COMMENT',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const EMAIL_TEMPLATE_KEYS = [
  'task-assigned',
  'task-completed',
  'deadline-tomorrow',
  'deadline-today',
  'event-created',
  'event-updated',
  'event-cancelled',
  'new-comment',
] as const;
export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];
