import { db } from '../lib/db';
import { isArchived } from '../lib/query';

function in7Days() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

/**
 * Everything the dashboard flags as needing a human. Each bucket used to be its
 * own aggregate query; DynamoDB has no aggregates, so the four source tables are
 * read once each and every bucket is derived from those in-memory lists.
 */
export async function getAttentionItems() {
  const now = new Date();
  const soon = in7Days();

  const [allTasks, allEvents, assignments, checklistRows, allAttachments] = await Promise.all([
    db.tasks.all(),
    db.events.all(),
    db.taskAssignees.all(),
    db.checklistItems.all(),
    db.attachments.all(),
  ]);

  const openTasks = allTasks.filter((t) => !isArchived(t.archivedAt) && t.status !== 'Completed');
  const activeEvents = allEvents.filter((e) => !isArchived(e.archivedAt));

  const overdueTasks = openTasks.filter((t) => t.deadline !== null && t.deadline <= now);
  const highPriorityTasks = openTasks.filter((t) => t.priority === 'High' || t.priority === 'Critical');
  const upcomingDeadlines = openTasks.filter(
    (t) => t.deadline !== null && t.deadline >= now && t.deadline <= soon,
  );

  const assignedTaskIds = new Set(assignments.map((row) => row.taskId));
  const unassignedTasks = openTasks.filter((t) => !assignedTaskIds.has(t.id));

  const checklistByEvent = new Map<string, { total: number; done: number }>();
  for (const item of checklistRows) {
    if (!item.eventId) continue;
    const entry = checklistByEvent.get(item.eventId) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (item.isDone) entry.done += 1;
    checklistByEvent.set(item.eventId, entry);
  }
  const incompleteChecklists = activeEvents.filter((e) => {
    const entry = checklistByEvent.get(e.id);
    return entry && entry.done < entry.total;
  });

  const withAttachments = new Set(allAttachments.map((row) => row.eventId).filter(Boolean));
  const missingDocuments = activeEvents.filter((e) => !withAttachments.has(e.id));

  const budgetPending = activeEvents.filter((e) => e.budget === null);

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
