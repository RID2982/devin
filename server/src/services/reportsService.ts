import { and, count, eq, gte, inArray, isNull, lt } from 'drizzle-orm';
import { db, schema } from '../lib/db';
import { AppError } from '../lib/AppError';

const { events, tasks, taskAssignees, people } = schema;

export async function monthly(month: string) {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) throw AppError.badRequest('month must be formatted YYYY-MM');
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));

  const monthEvents = await db.select().from(events).where(and(isNull(events.archivedAt), gte(events.date, start), lt(events.date, end)));
  const eventIds = monthEvents.map((e) => e.id);

  const relevantTasks = eventIds.length
    ? await db.select().from(tasks).where(and(isNull(tasks.archivedAt), inArray(tasks.eventId, eventIds)))
    : [];

  return {
    month,
    events: monthEvents,
    totals: {
      events: monthEvents.length,
      tasks: relevantTasks.length,
      completedTasks: relevantTasks.filter((t) => t.status === 'Completed').length,
      pendingTasks: relevantTasks.filter((t) => t.status !== 'Completed').length,
    },
  };
}

export async function eventSummary(eventId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw AppError.notFound('Event', eventId);
  const eventTasks = await db.select().from(tasks).where(eq(tasks.eventId, eventId));
  return {
    event,
    totalTasks: eventTasks.length,
    completedTasks: eventTasks.filter((t) => t.status === 'Completed').length,
    overdueTasks: eventTasks.filter((t) => t.status !== 'Completed' && t.deadline && t.deadline < new Date()).length,
  };
}

export async function productivity() {
  const rows = await db
    .select({ personId: taskAssignees.personId, personName: people.name, completed: count() })
    .from(taskAssignees)
    .innerJoin(people, eq(taskAssignees.personId, people.id))
    .innerJoin(tasks, eq(taskAssignees.taskId, tasks.id))
    .where(eq(tasks.status, 'Completed'))
    .groupBy(taskAssignees.personId, people.name);

  return { byPerson: rows };
}

export const reportsService = { monthly, eventSummary, productivity };
