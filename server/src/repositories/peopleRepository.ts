import { and, asc, desc, eq, ilike, isNotNull, isNull, or, sql, SQL } from 'drizzle-orm';
import { db, schema } from '../lib/db';
import type { ListQuery } from '../lib/listQuery';

const { people } = schema;

function buildWhere(query: ListQuery): SQL | undefined {
  const conditions: SQL[] = [];
  conditions.push(query.archived ? isNotNull(people.archivedAt) : isNull(people.archivedAt));
  if (query.filters.role) conditions.push(eq(people.role, query.filters.role));
  if (query.search) conditions.push(or(ilike(people.name, `%${query.search}%`), ilike(people.email, `%${query.search}%`))!);
  return conditions.length ? and(...conditions) : undefined;
}

export async function list(query: ListQuery) {
  const where = buildWhere(query);
  const orderBy = query.sortDir === 'desc' ? desc(people.name) : asc(people.name);

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(people).where(where).orderBy(orderBy).limit(query.pageSize).offset((query.page - 1) * query.pageSize),
    db.select({ count: sql<number>`count(*)::int` }).from(people).where(where),
  ]);
  return { rows, total: count };
}

export async function findById(id: string) {
  return db.query.people.findFirst({ where: eq(people.id, id) });
}

export async function create(values: typeof people.$inferInsert) {
  const [row] = await db.insert(people).values(values).returning();
  return row;
}

export async function update(id: string, values: Partial<typeof people.$inferInsert>) {
  const [row] = await db.update(people).set({ ...values, updatedAt: new Date() }).where(eq(people.id, id)).returning();
  return row;
}

export async function setArchived(id: string, archived: boolean) {
  const [row] = await db.update(people).set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() }).where(eq(people.id, id)).returning();
  return row;
}

export const peopleRepository = { list, findById, create, update, setArchived };
