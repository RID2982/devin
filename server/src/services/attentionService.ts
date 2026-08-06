import { and, eq, gte, isNull, lte, ne, notInArray, sql } from 'drizzle-orm';
import { db, schema } from '../lib/db';

const { events, tasks, taskAssignees, checklistItems, attachments } = schema;

function in7Days() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

export async function getAttentionItems() {
  const activeTask = isNull(tasks.archivedAt);
  const activeEvent = isNull(events.archivedAt);
  const now = new Date();

  const [overdueTasks, highPriorityTasks, upcomingDeadlines, assignedTaskIds, allOpenTasks, allActiveEvents, checklistRows, attachmentEventIds] =
    await Promise.all([
      db.select().from(tasks).where(and(activeTask, ne(tasks.status, 'Completed'), lte(tasks.deadline, now))),
      db.select().from(tasks).where(and(activeTask, ne(tasks.status, 'Completed'), sql`${tasks.priority} in ('High','Critical')`)),
      db.select().from(tasks).where(and(activeTask, ne(tasks.status, 'Completed'), gte(tasks.deadline, now), lte(tasks.deadline, in7Days()))),
      db.selectDistinct({ taskId: taskAssignees.taskId }).from(taskAssignees),
      db.select().from(tasks).where(and(activeTask, ne(tasks.status, 'Completed'))),
      db.select().from(events).where(activeEvent),
      db.select().from(checklistItems),
      db.selectDistinct({ eventId: attachments.eventId }).from(attachments),
    ]);

  const assignedSet = new Set(assignedTaskIds.map((r) => r.taskId));
  const unassignedTasks = allOpenTasks.filter((t) => !assignedSet.has(t.id));

  const checklistByEvent = new Map<string, { total: number; done: number }>();
  for (const item of checklistRows) {
    if (!item.eventId) continue;
    const entry = checklistByEvent.get(item.eventId) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (item.isDone) entry.done += 1;
    checklistByEvent.set(item.eventId, entry);
  }
  const incompleteChecklists = allActiveEvents.filter((e) => {
    const entry = checklistByEvent.get(e.id);
    return entry && entry.done < entry.total;
  });

  const withAttachments = new Set(attachmentEventIds.map((r) => r.eventId));
  const missingDocuments = allActiveEvents.filter((e) => !withAttachments.has(e.id));

  const budgetPending = allActiveEvents.filter((e) => e.budget === null);

  return {
    overdueTasks,
    highPriorityTasks,
    upcomingDeadlines,
    unassignedTasks,
    incompleteChecklists,
    missingDocuments,
    budgetPending,
  };
}

export const attentionService = { getAttentionItems };
