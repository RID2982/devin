import type { Event, EventPerson, Person } from '@app/database';
import { db, schema } from '../lib/db';
import { ilikeAny, isArchived, paginate, sortRows } from '../lib/query';
import type { ListQuery } from '../lib/listQuery';

// Events are listed by whichever column the UI picked, with free-text search and
// month filtering — none of which is a DynamoDB key access pattern. So the table
// is read and narrowed in memory. That is fine at this app's scale (one club's
// events); if the table ever grows past a few thousand items, the move is a GSI
// on `date` and a Query bounded by the visible range.

function matches(event: Event, query: ListQuery): boolean {
  if (isArchived(event.archivedAt) !== query.archived) return false;

  if (query.filters.status && event.status !== query.filters.status) return false;
  if (query.filters.priority && event.priority !== query.filters.priority) return false;
  if (query.filters.category && event.category !== query.filters.category) return false;

  if (query.filters.month) {
    const [y, m] = query.filters.month.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    if (!(event.date >= start && event.date < end)) return false;
  }

  if (query.search && !ilikeAny(query.search, event.name, event.venue, event.description)) {
    return false;
  }

  return true;
}

const SORTABLE = ['date', 'name', 'priority', 'status', 'createdAt'] as const;

export async function list(query: ListQuery) {
  const all = await db.events.all();
  const filtered = all.filter((event) => matches(event, query));

  const sortBy = (SORTABLE as readonly string[]).includes(query.sortBy ?? '')
    ? (query.sortBy as string)
    : 'date';
  const sorted = sortRows(filtered, schema.events, sortBy, query.sortDir);

  return { rows: paginate(sorted, query.page, query.pageSize), total: filtered.length };
}

/** The event plus its roster, matching the nested shape the detail page reads. */
export async function findById(id: string) {
  const event = await db.events.getById(id);
  if (!event) return undefined;

  const roster = await db.eventPeople.query(id);
  const persons = await db.people.getMany(roster.map((row) => row.personId));
  const byId = new Map(persons.map((person) => [person.id, person]));

  const eventPeople: (EventPerson & { person: Person | null })[] = roster.map((row) => ({
    ...row,
    person: byId.get(row.personId) ?? null,
  }));

  return { ...event, eventPeople };
}

export async function create(values: Partial<Event>) {
  return db.events.create(values);
}

export async function update(id: string, values: Partial<Event>) {
  return db.events.updateById(id, { ...values, updatedAt: new Date() });
}

export async function setArchived(id: string, archived: boolean) {
  return db.events.updateById(id, { archivedAt: archived ? new Date() : null, updatedAt: new Date() });
}

export const eventsRepository = { list, findById, create, update, setArchived };
