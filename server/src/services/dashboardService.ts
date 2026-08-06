import { and, count, desc, eq, gte, isNull, lt, lte, ne } from 'drizzle-orm';
import { db, schema } from '../lib/db';
import { attentionService } from './attentionService';

const { events, tasks, activityLogs } = schema;

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

export async function getOverview() {
  const activeEvent = isNull(events.archivedAt);
  const activeTask = isNull(tasks.archivedAt);
  const now = new Date();

  const [
    [totalEvents],
    [totalTasks],
    [pendingTasks],
    [completedTasks],
    [overdueTasks],
    [highPriorityTasks],
    [thisMonthEvents],
    [upcomingDeadlines],
    upcomingEvents,
    todaysTasks,
    recentlyCompleted,
    recentActivity,
    attentionItems,
  ] = await Promise.all([
    db.select({ n: count() }).from(events).where(activeEvent),
    db.select({ n: count() }).from(tasks).where(activeTask),
    db.select({ n: count() }).from(tasks).where(and(activeTask, eq(tasks.status, 'Pending'))),
    db.select({ n: count() }).from(tasks).where(and(activeTask, eq(tasks.status, 'Completed'))),
    db.select({ n: count() }).from(tasks).where(and(activeTask, ne(tasks.status, 'Completed'), lt(tasks.deadline, now))),
    db.select({ n: count() }).from(tasks).where(and(activeTask, ne(tasks.status, 'Completed'), eq(tasks.priority, 'High'))),
    db.select({ n: count() }).from(events).where(and(activeEvent, gte(events.date, startOfMonth()), lt(events.date, startOfNextMonth()))),
    db.select({ n: count() }).from(tasks).where(and(activeTask, ne(tasks.status, 'Completed'), gte(tasks.deadline, now), lte(tasks.deadline, in7Days()))),
    db.select().from(events).where(and(activeEvent, gte(events.date, now))).orderBy(events.date).limit(6),
    db.select().from(tasks).where(and(activeTask, gte(tasks.deadline, startOfToday()), lt(tasks.deadline, endOfToday()))).orderBy(tasks.priority),
    db.select().from(tasks).where(and(activeTask, eq(tasks.status, 'Completed'))).orderBy(desc(tasks.updatedAt)).limit(6),
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(10),
    attentionService.getAttentionItems(),
  ]);

  return {
    stats: {
      totalEvents: totalEvents.n,
      totalTasks: totalTasks.n,
      pendingTasks: pendingTasks.n,
      completedTasks: completedTasks.n,
      overdueTasks: overdueTasks.n,
      highPriorityTasks: highPriorityTasks.n,
      thisMonthEvents: thisMonthEvents.n,
      upcomingDeadlines: upcomingDeadlines.n,
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
