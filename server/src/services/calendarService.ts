import { db } from '../lib/db';
import { isArchived } from '../lib/query';

export async function getRange(from: Date, to: Date) {
  const [allEvents, allTasks] = await Promise.all([db.events.all(), db.tasks.all()]);

  const rangeEvents = allEvents.filter(
    (e) => !isArchived(e.archivedAt) && e.date >= from && e.date <= to,
  );
  const rangeTasks = allTasks.filter(
    (t) => !isArchived(t.archivedAt) && t.deadline !== null && t.deadline >= from && t.deadline <= to,
  );

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
