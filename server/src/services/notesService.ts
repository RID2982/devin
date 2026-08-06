import { and, eq, isNull } from 'drizzle-orm';
import { db, schema } from '../lib/db';
import { AppError } from '../lib/AppError';
import { activityLogService } from './activityLogService';

const { notes } = schema;

export async function listFor(eventId: string) {
  return db.select().from(notes).where(and(eq(notes.eventId, eventId), isNull(notes.archivedAt)));
}

export async function create(eventId: string, title: string | undefined, bodyMarkdown: string) {
  const [row] = await db.insert(notes).values({ eventId, title, bodyMarkdown }).returning();
  return row;
}

export async function update(id: string, values: { title?: string; bodyMarkdown?: string }, actorUserId?: string) {
  const [row] = await db.update(notes).set({ ...values, updatedAt: new Date() }).where(eq(notes.id, id)).returning();
  if (!row) throw AppError.notFound('Note', id);
  await activityLogService.record({ action: 'NOTE_UPDATED', summary: `Note "${row.title ?? 'Untitled'}" updated`, eventId: row.eventId ?? undefined, actorUserId });
  return row;
}

export async function remove(id: string) {
  await db.update(notes).set({ archivedAt: new Date() }).where(eq(notes.id, id));
}

export const notesService = { listFor, create, update, remove };
