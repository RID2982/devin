import type { ChecklistItem } from '@app/database';
import { db, INDEXES } from '../lib/db';
import { AppError } from '../lib/AppError';
import { sortByKey } from '../lib/query';
import { activityLogService } from './activityLogService';
import type { CreateChecklistItemInput, UpdateChecklistItemInput } from '../validators/checklist.schema';

export async function listFor(eventId?: string, taskId?: string) {
  if (eventId) {
    const items = await db.checklistItems.queryIndex(INDEXES.checklistItemsByEvent, eventId);
    return sortByKey(items, 'order');
  }
  if (taskId) {
    const items = await db.checklistItems.queryIndex(INDEXES.checklistItemsByTask, taskId);
    return sortByKey(items, 'order');
  }
  throw AppError.badRequest('eventId or taskId query param is required');
}

export async function create(input: CreateChecklistItemInput, actorUserId?: string) {
  const row = await db.checklistItems.create(input);
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
  const existing = await db.checklistItems.getById(id);
  if (!existing) throw AppError.notFound('ChecklistItem', id);

  const values: Partial<ChecklistItem> = { ...input, updatedAt: new Date() };
  if (input.isDone !== undefined) values.completedAt = input.isDone ? new Date() : null;

  const row = (await db.checklistItems.updateById(id, values))!;

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
  await db.checklistItems.deleteById(id);
}

export async function reorder(items: { id: string; order: number }[]) {
  await Promise.all(items.map((i) => db.checklistItems.updateById(i.id, { order: i.order })));
  return { success: true };
}

export const checklistService = { listFor, create, update, remove, reorder };
