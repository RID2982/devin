import type { ActivityAction } from '@app/shared';
import { db, schema } from '../lib/db';

interface RecordActivityInput {
  action: ActivityAction;
  summary: string;
  eventId?: string;
  taskId?: string;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Single write path for activity history. Every service that mutates domain data calls this
 * (never routes/controllers directly) so the global Recent Activity feed and each event's
 * Timeline tab can never silently miss an entry.
 */
export async function record(input: RecordActivityInput) {
  await db.insert(schema.activityLogs).values({
    action: input.action,
    summary: input.summary,
    eventId: input.eventId,
    taskId: input.taskId,
    actorUserId: input.actorUserId,
    metadata: input.metadata,
  });
}

export const activityLogService = { record };
