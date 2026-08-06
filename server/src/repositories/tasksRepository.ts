import { and, asc, desc, eq, ilike, isNotNull, isNull, or, sql, SQL } from 'drizzle-orm';
import { db, schema } from '../lib/db';
import type { ListQuery } from '../lib/listQuery';

const { tasks } = schema;

function buildWhere(query: ListQuery): SQL | undefined {
  const conditions: SQL[] = [];
  conditions.push(query.archived ? isNotNull(tasks.archivedAt) : isNull(tasks.archivedAt));

  if (query.filters.status) conditions.push(eq(tasks.status, query.filters.status as never));
  if (query.filters.priority) conditions.push(eq(tasks.priority, query.filters.priority as never));
  if (query.filters.eventId) conditions.push(eq(tasks.eventId, query.filters.eventId));
  if (query.search) conditions.push(or(ilike(tasks.title, `%${query.search}%`), ilike(tasks.description, `%${query.search}%`))!);

  return conditions.length ? and(...conditions) : undefined;
}

const SORTABLE = { deadline: tasks.deadline, priority: tasks.priority, status: tasks.status, order: tasks.order, createdAt: tasks.createdAt } as const;

export async function list(query: ListQuery) {
  const where = buildWhere(query);
  const sortCol = SORTABLE[(query.sortBy as keyof typeof SORTABLE) ?? 'order'] ?? tasks.order;
  const orderBy = query.sortDir === 'desc' ? desc(sortCol) : asc(sortCol);

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(tasks).where(where).orderBy(orderBy).limit(query.pageSize).offset((query.page - 1) * query.pageSize),
    db.select({ count: sql<number>`count(*)::int` }).from(tasks).where(where),
  ]);

  return { rows, total: count };
}

export async function findById(id: string) {
  return db.query.tasks.findFirst({ where: eq(tasks.id, id) });
}

export async function create(values: typeof tasks.$inferInsert) {
  const [row] = await db.insert(tasks).values(values).returning();
  return row;
}

export async function update(id: string, values: Partial<typeof tasks.$inferInsert>) {
  const [row] = await db.update(tasks).set({ ...values, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
  return row;
}

export async function setArchived(id: string, archived: boolean) {
  const [row] = await db.update(tasks).set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
  return row;
}

export const tasksRepository = { list, findById, create, update, setArchived };
