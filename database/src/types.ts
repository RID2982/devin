import type {
  ActivityAction,
  AttendanceStatus,
  EmailStatus,
  EventStatus,
  NotificationType,
  PermissionLevel,
  Priority,
  TaskStatus,
} from '@app/shared';

// Row shapes as they come back out of the Table wrapper: every declared column
// present, dates as `Date`, unset columns as `null` — i.e. exactly what
// `SELECT *` used to hand the services.

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

export interface Event {
  id: string;
  name: string;
  category: string | null;
  date: Date;
  endDate: Date | null;
  time: string | null;
  venue: string | null;
  /** numeric(12,2) came back from pg as a string; kept that way. */
  budget: string | null;
  expenses: unknown[];
  status: EventStatus;
  priority: Priority;
  color: string | null;
  description: string | null;
  coverImagePath: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  deadline: Date | null;
  priority: Priority;
  status: TaskStatus;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  order: number;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Person {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  department: string | null;
  organization: string | null;
  skills: string[] | null;
  avatarPath: string | null;
  notes: string | null;
  isActive: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventPerson {
  id: string;
  eventId: string;
  personId: string;
  roleOnEvent: string | null;
  createdAt: Date;
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  personId: string;
  assignedAt: Date;
}

export interface EventAttendanceRow {
  id: string;
  eventId: string;
  personId: string;
  status: AttendanceStatus;
  markedAt: Date | null;
  markedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  isDone: boolean;
  order: number;
  eventId: string | null;
  taskId: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  isBuiltIn: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateItem {
  id: string;
  templateId: string;
  label: string;
  order: number;
}

export interface Comment {
  id: string;
  body: string;
  authorUserId: string | null;
  eventId: string | null;
  taskId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  filename: string;
  storedPath: string;
  mimeType: string | null;
  sizeBytes: number | null;
  eventId: string | null;
  taskId: string | null;
  uploadedByUserId: string | null;
  createdAt: Date;
}

export interface Note {
  id: string;
  title: string | null;
  bodyMarkdown: string;
  eventId: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export interface EventTag {
  eventId: string;
  tagId: string;
}

export interface TaskTag {
  taskId: string;
  tagId: string;
}

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  summary: string;
  eventId: string | null;
  taskId: string | null;
  actorUserId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  templateKey: string;
  payload: unknown;
  status: EmailStatus;
  transport: string;
  relatedEventId: string | null;
  relatedTaskId: string | null;
  sentAt: Date;
}

export interface Notification {
  id: string;
  userId: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  isRead: boolean;
  relatedEventId: string | null;
  relatedTaskId: string | null;
  createdAt: Date;
}

export interface Permission {
  id: string;
  subjectEmail: string;
  eventId: string | null;
  level: PermissionLevel;
  invitedAt: Date;
  acceptedAt: Date | null;
}

export interface AppSetting {
  key: string;
  value: unknown;
  updatedAt: Date;
}
