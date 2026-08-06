import { eq } from 'drizzle-orm';
import { db, schema } from '../lib/db';
import { AppError } from '../lib/AppError';
import { activityLogService } from './activityLogService';

const { comments, events, tasks } = schema;

export async function listFor(eventId?: string, taskId?: string) {
  if (eventId) return db.select().from(comments).where(eq(comments.eventId, eventId)).orderBy(comments.createdAt);
  if (taskId) return db.select().from(comments).where(eq(comments.taskId, taskId)).orderBy(comments.createdAt);
  throw AppError.badRequest('eventId or taskId query param is required');
}

export async function create(input: { body: string; eventId?: string; taskId?: string }, actorUserId?: string) {
  const [row] = await db.insert(comments).values({ ...input, authorUserId: actorUserId }).returning();

  let subject = '';
  if (row.eventId) {
    const [e] = await db.select({ name: events.name }).from(events).where(eq(events.id, row.eventId)).limit(1);
    subject = e?.name ?? '';
  } else if (row.taskId) {
    const [t] = await db.select({ title: tasks.title }).from(tasks).where(eq(tasks.id, row.taskId)).limit(1);
    subject = t?.title ?? '';
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
  const [row] = await db.update(comments).set({ body, updatedAt: new Date() }).where(eq(comments.id, id)).returning();
  if (!row) throw AppError.notFound('Comment', id);
  return row;
}

export async function remove(id: string) {
  await db.delete(comments).where(eq(comments.id, id));
}

export const commentsService = { listFor, create, update, remove };
