import { and, asc, desc, eq, gte, ilike, isNull, isNotNull, lt, or, sql, SQL } from 'drizzle-orm';
import { db, schema } from '../lib/db';
import type { ListQuery } from '../lib/listQuery';

const { events } = schema;

function buildWhere(query: ListQuery): SQL | undefined {
  const conditions: SQL[] = [];

  conditions.push(query.archived ? isNotNull(events.archivedAt) : isNull(events.archivedAt));

  if (query.filters.status) conditions.push(eq(events.status, query.filters.status as never));
  if (query.filters.priority) conditions.push(eq(events.priority, query.filters.priority as never));
  if (query.filters.category) conditions.push(eq(events.category, query.filters.category));
  if (query.filters.month) {
    const [y, m] = query.filters.month.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    conditions.push(and(gte(events.date, start), lt(events.date, end))!);
  }
  if (query.search) {
    const like = `%${query.search}%`;
    conditions.push(
      or(ilike(events.name, like), ilike(events.venue, like), ilike(events.description, like))!,
    );
  }

  return conditions.length ? and(...conditions) : undefined;
}

const SORTABLE = { date: events.date, name: events.name, priority: events.priority, status: events.status, createdAt: events.createdAt } as const;

export async function list(query: ListQuery) {
  const where = buildWhere(query);
  const sortCol = SORTABLE[(query.sortBy as keyof typeof SORTABLE) ?? 'date'] ?? events.date;
  const orderBy = query.sortDir === 'desc' ? desc(sortCol) : asc(sortCol);

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(events)
      .where(where)
      .orderBy(orderBy)
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ count: sql<number>`count(*)::int` }).from(events).where(where),
  ]);

  return { rows, total: count };
}

export async function findById(id: string) {
  return db.query.events.findFirst({
    where: eq(events.id, id),
    with: { eventPeople: { with: { person: true } } },
  });
}

export async function create(values: typeof events.$inferInsert) {
  const [row] = await db.insert(events).values(values).returning();
  return row;
}

export async function update(id: string, values: Partial<typeof events.$inferInsert>) {
  const [row] = await db
    .update(events)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning();
  return row;
}

export async function setArchived(id: string, archived: boolean) {
  const [row] = await db
    .update(events)
    .set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning();
  return row;
}

export const eventsRepository = { list, findById, create, update, setArchived };
