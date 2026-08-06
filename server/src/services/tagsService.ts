import { and, eq } from 'drizzle-orm';
import { db, schema } from '../lib/db';

const { tags, eventTags, taskTags } = schema;

export async function list() {
  return db.select().from(tags).orderBy(tags.name);
}

export async function create(name: string, color?: string) {
  const [row] = await db.insert(tags).values({ name, color }).returning();
  return row;
}

export async function attachToEvent(eventId: string, tagId: string) {
  await db.insert(eventTags).values({ eventId, tagId }).onConflictDoNothing();
}

export async function detachFromEvent(eventId: string, tagId: string) {
  await db.delete(eventTags).where(and(eq(eventTags.eventId, eventId), eq(eventTags.tagId, tagId)));
}

export async function attachToTask(taskId: string, tagId: string) {
  await db.insert(taskTags).values({ taskId, tagId }).onConflictDoNothing();
}

export async function detachFromTask(taskId: string, tagId: string) {
  await db.delete(taskTags).where(and(eq(taskTags.taskId, taskId), eq(taskTags.tagId, tagId)));
}

export const tagsService = { list, create, attachToEvent, detachFromEvent, attachToTask, detachFromTask };
