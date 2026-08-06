import { and, gte, isNull, lte } from 'drizzle-orm';
import { db, schema } from '../lib/db';

const { events, tasks } = schema;

export async function getRange(from: Date, to: Date) {
  const [rangeEvents, rangeTasks] = await Promise.all([
    db.select().from(events).where(and(isNull(events.archivedAt), gte(events.date, from), lte(events.date, to))),
    db.select().from(tasks).where(and(isNull(tasks.archivedAt), gte(tasks.deadline, from), lte(tasks.deadline, to))),
  ]);

  return {
    events: rangeEvents.map((e) => ({
      id: e.id,
      type: 'event' as const,
      title: e.name,
      date: e.date,
      status: e.status,
      priority: e.priority,
      venue: e.venue,
      color: e.color,
    })),
    tasks: rangeTasks.map((t) => ({
      id: t.id,
      type: 'task' as const,
      title: t.title,
      date: t.deadline,
      status: t.status,
      priority: t.priority,
      eventId: t.eventId,
    })),
  };
}

export const calendarService = { getRange };
