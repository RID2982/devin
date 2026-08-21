import { db } from '../lib/db';
import { sortByKey } from '../lib/query';

export async function list() {
  return sortByKey(await db.tags.all(), 'name');
}

export async function create(name: string, color?: string) {
  return db.tags.create({ name, color });
}

export async function attachToEvent(eventId: string, tagId: string) {
  await db.eventTags.createIfNotExists({ eventId, tagId });
}

export async function detachFromEvent(eventId: string, tagId: string) {
  await db.eventTags.delete({ eventId, tagId });
}

export async function attachToTask(taskId: string, tagId: string) {
  await db.taskTags.createIfNotExists({ taskId, tagId });
}

export async function detachFromTask(taskId: string, tagId: string) {
  await db.taskTags.delete({ taskId, tagId });
}

export const tagsService = { list, create, attachToEvent, detachFromEvent, attachToTask, detachFromTask };
