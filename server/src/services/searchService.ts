import { ilike, isNull, and, or } from 'drizzle-orm';
import { db, schema } from '../lib/db';

const { events, tasks, people } = schema;

export async function search(q: string) {
  const like = `%${q}%`;

  const [matchedEvents, matchedTasks, matchedPeople] = await Promise.all([
    db.select().from(events).where(and(isNull(events.archivedAt), or(ilike(events.name, like), ilike(events.venue, like), ilike(events.category, like)))).limit(10),
    db.select().from(tasks).where(and(isNull(tasks.archivedAt), or(ilike(tasks.title, like), ilike(tasks.description, like)))).limit(10),
    db.select().from(people).where(and(isNull(people.archivedAt), or(ilike(people.name, like), ilike(people.email, like), ilike(people.role, like)))).limit(10),
  ]);

  return { events: matchedEvents, tasks: matchedTasks, people: matchedPeople };
}

export const searchService = { search };
