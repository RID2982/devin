import { db, INDEXES } from '../lib/db';
import { AppError } from '../lib/AppError';
import { isArchived } from '../lib/query';
import { activityLogService } from './activityLogService';

export async function listFor(eventId: string) {
  const rows = await db.notes.queryIndex(INDEXES.notesByEvent, eventId);
  return rows.filter((note) => !isArchived(note.archivedAt));
}

export async function create(eventId: string, title: string | undefined, bodyMarkdown: string) {
  return db.notes.create({ eventId, title, bodyMarkdown });
}

export async function update(id: string, values: { title?: string; bodyMarkdown?: string }, actorUserId?: string) {
  const row = await db.notes.updateById(id, { ...values, updatedAt: new Date() });
  if (!row) throw AppError.notFound('Note', id);
  await activityLogService.record({
    action: 'NOTE_UPDATED',
    summary: `Note "${row.title ?? 'Untitled'}" updated`,
    eventId: row.eventId ?? undefined,
    actorUserId,
  });
  return row;
}

export async function remove(id: string) {
  await db.notes.updateById(id, { archivedAt: new Date() });
}

export const notesService = { listFor, create, update, remove };
