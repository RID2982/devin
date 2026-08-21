import { db, INDEXES } from '../lib/db';
import { AppError } from '../lib/AppError';
import { isArchived } from '../lib/query';

export async function monthly(month: string) {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) throw AppError.badRequest('month must be formatted YYYY-MM');
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));

  const allEvents = await db.events.all();
  const monthEvents = allEvents.filter(
    (e) => !isArchived(e.archivedAt) && e.date >= start && e.date < end,
  );

  const eventIds = new Set(monthEvents.map((e) => e.id));
  const allTasks = eventIds.size ? await db.tasks.all() : [];
  const relevantTasks = allTasks.filter((t) => !isArchived(t.archivedAt) && eventIds.has(t.eventId));

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
  const event = await db.events.getById(eventId);
  if (!event) throw AppError.notFound('Event', eventId);

  const eventTasks = await db.tasks.queryIndex(INDEXES.tasksByEvent, eventId);
  const now = new Date();

  return {
    event,
    totalTasks: eventTasks.length,
    completedTasks: eventTasks.filter((t) => t.status === 'Completed').length,
    overdueTasks: eventTasks.filter((t) => t.status !== 'Completed' && t.deadline && t.deadline < now)
      .length,
  };
}

/** Completed-task counts per assignee — the GROUP BY, done over three table reads. */
export async function productivity() {
  const [assignments, allTasks, allPeople] = await Promise.all([
    db.taskAssignees.all(),
    db.tasks.all(),
    db.people.all(),
  ]);

  const completedTaskIds = new Set(
    allTasks.filter((task) => task.status === 'Completed').map((task) => task.id),
  );
  const personById = new Map(allPeople.map((person) => [person.id, person]));

  const counts = new Map<string, { personId: string; personName: string; completed: number }>();
  for (const assignment of assignments) {
    if (!completedTaskIds.has(assignment.taskId)) continue;
    const person = personById.get(assignment.personId);
    if (!person) continue; // INNER JOIN people

    const entry = counts.get(person.id) ?? { personId: person.id, personName: person.name, completed: 0 };
    entry.completed += 1;
    counts.set(person.id, entry);
  }

  return { byPerson: [...counts.values()] };
}

export const reportsService = { monthly, eventSummary, productivity };
