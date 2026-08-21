import { db, schema } from '../lib/db';
import { isArchived, sortByKey, sortRows } from '../lib/query';
import { attentionService } from './attentionService';

function startOfToday() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
function endOfToday() {
  const d = startOfToday();
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}
function startOfMonth() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function startOfNextMonth() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}
function in7Days() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

/**
 * Eight counters and five widget lists. Under Postgres that was thirteen
 * queries; here it is three table reads (plus the attention buckets), with every
 * figure computed from the same in-memory snapshot — which also means the
 * numbers are consistent with each other, as they were inside one connection.
 */
export async function getOverview() {
  const now = new Date();

  const [allEvents, allTasks, allActivity, attentionItems] = await Promise.all([
    db.events.all(),
    db.tasks.all(),
    db.activityLogs.all(),
    attentionService.getAttentionItems(),
  ]);

  const activeEvents = allEvents.filter((e) => !isArchived(e.archivedAt));
  const activeTasks = allTasks.filter((t) => !isArchived(t.archivedAt));
  const openTasks = activeTasks.filter((t) => t.status !== 'Completed');

  const upcomingEvents = sortByKey(
    activeEvents.filter((e) => e.date >= now),
    'date',
  ).slice(0, 6);

  const todaysTasks = sortRows(
    activeTasks.filter(
      (t) => t.deadline !== null && t.deadline >= startOfToday() && t.deadline < endOfToday(),
    ),
    schema.tasks,
    'priority',
  );

  const recentlyCompleted = sortByKey(
    activeTasks.filter((t) => t.status === 'Completed'),
    'updatedAt',
    'desc',
  ).slice(0, 6);

  const recentActivity = sortByKey(allActivity, 'createdAt', 'desc').slice(0, 10);

  return {
    stats: {
      totalEvents: activeEvents.length,
      totalTasks: activeTasks.length,
      pendingTasks: activeTasks.filter((t) => t.status === 'Pending').length,
      completedTasks: activeTasks.filter((t) => t.status === 'Completed').length,
      overdueTasks: openTasks.filter((t) => t.deadline !== null && t.deadline < now).length,
      highPriorityTasks: openTasks.filter((t) => t.priority === 'High').length,
      thisMonthEvents: activeEvents.filter((e) => e.date >= startOfMonth() && e.date < startOfNextMonth())
        .length,
      upcomingDeadlines: openTasks.filter(
        (t) => t.deadline !== null && t.deadline >= now && t.deadline <= in7Days(),
      ).length,
    },
    widgets: {
      upcomingEvents,
      todaysTasks,
      recentlyCompleted,
      recentActivity,
      attention: attentionItems,
    },
  };
}

export const dashboardService = { getOverview };
