import { db } from '../lib/db';
import { ilikeAny, isArchived } from '../lib/query';

export async function search(q: string) {
  const [allEvents, allTasks, allPeople] = await Promise.all([
    db.events.all(),
    db.tasks.all(),
    db.people.all(),
  ]);

  return {
    events: allEvents
      .filter((e) => !isArchived(e.archivedAt) && ilikeAny(q, e.name, e.venue, e.category))
      .slice(0, 10),
    tasks: allTasks
      .filter((t) => !isArchived(t.archivedAt) && ilikeAny(q, t.title, t.description))
      .slice(0, 10),
    people: allPeople
      .filter((p) => !isArchived(p.archivedAt) && ilikeAny(q, p.name, p.email, p.role))
      .slice(0, 10),
  };
}

export const searchService = { search };
