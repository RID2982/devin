import { eq } from 'drizzle-orm';
import { db, schema } from '../lib/db';
import { AppError } from '../lib/AppError';
import { activityLogService } from './activityLogService';
import type { CreateChecklistItemInput, UpdateChecklistItemInput } from '../validators/checklist.schema';

const { checklistItems } = schema;

export async function listFor(eventId?: string, taskId?: string) {
  if (eventId) return db.select().from(checklistItems).where(eq(checklistItems.eventId, eventId)).orderBy(checklistItems.order);
  if (taskId) return db.select().from(checklistItems).where(eq(checklistItems.taskId, taskId)).orderBy(checklistItems.order);
  throw AppError.badRequest('eventId or taskId query param is required');
}

export async function create(input: CreateChecklistItemInput, actorUserId?: string) {
  const [row] = await db.insert(checklistItems).values(input).returning();
  await activityLogService.record({
    action: 'CHECKLIST_ITEM_ADDED',
    summary: `Checklist item "${row.label}" added`,
    eventId: row.eventId ?? undefined,
    taskId: row.taskId ?? undefined,
    actorUserId,
  });
  return row;
}

export async function update(id: string, input: UpdateChecklistItemInput, actorUserId?: string) {
  const [existing] = await db.select().from(checklistItems).where(eq(checklistItems.id, id)).limit(1);
  if (!existing) throw AppError.notFound('ChecklistItem', id);

  const values: Partial<typeof checklistItems.$inferInsert> = { ...input, updatedAt: new Date() };
  if (input.isDone !== undefined) values.completedAt = input.isDone ? new Date() : null;

  const [row] = await db.update(checklistItems).set(values).where(eq(checklistItems.id, id)).returning();

  if (input.isDone && !existing.isDone) {
    await activityLogService.record({
      action: 'CHECKLIST_ITEM_DONE',
      summary: `Checklist item "${row.label}" marked done`,
      eventId: row.eventId ?? undefined,
      taskId: row.taskId ?? undefined,
      actorUserId,
    });
  }

  return row;
}

export async function remove(id: string) {
  await db.delete(checklistItems).where(eq(checklistItems.id, id));
}

export async function reorder(items: { id: string; order: number }[]) {
  await Promise.all(items.map((i) => db.update(checklistItems).set({ order: i.order }).where(eq(checklistItems.id, i.id))));
  return { success: true };
}

export const checklistService = { listFor, create, update, remove, reorder };
