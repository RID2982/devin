import type { Person } from '@app/database';
import { db, schema } from '../lib/db';
import { ilikeAny, isArchived, paginate, sortRows } from '../lib/query';
import type { ListQuery } from '../lib/listQuery';

function matches(person: Person, query: ListQuery): boolean {
  if (isArchived(person.archivedAt) !== query.archived) return false;
  if (query.filters.role && person.role !== query.filters.role) return false;
  if (query.search && !ilikeAny(query.search, person.name, person.email)) return false;
  return true;
}

export async function list(query: ListQuery) {
  const all = await db.people.all();
  const filtered = all.filter((person) => matches(person, query));
  // People are always ordered by name; only the direction is caller-controlled.
  const sorted = sortRows(filtered, schema.people, 'name', query.sortDir);

  return { rows: paginate(sorted, query.page, query.pageSize), total: filtered.length };
}

export async function findById(id: string) {
  return db.people.getById(id);
}

export async function create(values: Partial<Person>) {
  return db.people.create(values);
}

export async function update(id: string, values: Partial<Person>) {
  return db.people.updateById(id, { ...values, updatedAt: new Date() });
}

export async function setArchived(id: string, archived: boolean) {
  return db.people.updateById(id, { archivedAt: archived ? new Date() : null, updatedAt: new Date() });
}

export const peopleRepository = { list, findById, create, update, setArchived };
