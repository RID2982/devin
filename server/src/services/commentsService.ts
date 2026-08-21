import { db, INDEXES } from '../lib/db';
import { AppError } from '../lib/AppError';
import { sortByKey } from '../lib/query';
import { activityLogService } from './activityLogService';

export async function listFor(eventId?: string, taskId?: string) {
  if (eventId) {
    const rows = await db.comments.queryIndex(INDEXES.commentsByEvent, eventId);
    return sortByKey(rows, 'createdAt');
  }
  if (taskId) {
    const rows = await db.comments.queryIndex(INDEXES.commentsByTask, taskId);
    return sortByKey(rows, 'createdAt');
  }
  throw AppError.badRequest('eventId or taskId query param is required');
}

export async function create(
  input: { body: string; eventId?: string; taskId?: string },
  actorUserId?: string,
) {
  const row = await db.comments.create({ ...input, authorUserId: actorUserId });

  let subject = '';
  if (row.eventId) {
    subject = (await db.events.getById(row.eventId))?.name ?? '';
  } else if (row.taskId) {
    subject = (await db.tasks.getById(row.taskId))?.title ?? '';
  }

  await activityLogService.record({
    action: 'COMMENT_ADDED',
    summary: `Comment added on "${subject}"`,
    eventId: row.eventId ?? undefined,
    taskId: row.taskId ?? undefined,
    actorUserId,
  });

  return row;
}

export async function update(id: string, body: string) {
  const row = await db.comments.updateById(id, { body, updatedAt: new Date() });
  if (!row) throw AppError.notFound('Comment', id);
  return row;
}

export async function remove(id: string) {
  await db.comments.deleteById(id);
}

export const commentsService = { listFor, create, update, remove };
