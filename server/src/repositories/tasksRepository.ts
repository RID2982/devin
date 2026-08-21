import type { Task } from '@app/database';
import { db, INDEXES, schema } from '../lib/db';
import { ilikeAny, isArchived, paginate, sortRows } from '../lib/query';
import type { ListQuery } from '../lib/listQuery';

function matches(task: Task, query: ListQuery): boolean {
  if (isArchived(task.archivedAt) !== query.archived) return false;
  if (query.filters.status && task.status !== query.filters.status) return false;
  if (query.filters.priority && task.priority !== query.filters.priority) return false;
  if (query.search && !ilikeAny(query.search, task.title, task.description)) return false;
  return true;
}

const SORTABLE = ['deadline', 'priority', 'status', 'order', 'createdAt'] as const;

export async function list(query: ListQuery) {
  // Filtering by event is the one access pattern with a key behind it, so it
  // reads the GSI instead of the whole table.
  const all = query.filters.eventId
    ? await db.tasks.queryIndex(INDEXES.tasksByEvent, query.filters.eventId)
    : await db.tasks.all();

  const filtered = all.filter((task) => matches(task, query));

  const sortBy = (SORTABLE as readonly string[]).includes(query.sortBy ?? '')
    ? (query.sortBy as string)
    : 'order';
  const sorted = sortRows(filtered, schema.tasks, sortBy, query.sortDir);

  return { rows: paginate(sorted, query.page, query.pageSize), total: filtered.length };
}

export async function findById(id: string) {
  return db.tasks.getById(id);
}

export async function create(values: Partial<Task>) {
  return db.tasks.create(values);
}

export async function update(id: string, values: Partial<Task>) {
  return db.tasks.updateById(id, { ...values, updatedAt: new Date() });
}

export async function setArchived(id: string, archived: boolean) {
  return db.tasks.updateById(id, { archivedAt: archived ? new Date() : null, updatedAt: new Date() });
}

export const tasksRepository = { list, findById, create, update, setArchived };
