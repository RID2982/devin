import { and, asc, gte, isNull, lt } from 'drizzle-orm';
import { db, schema } from '../lib/db';

const { events } = schema;

export async function getYear(year: number) {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const rows = await db
    .select()
    .from(events)
    .where(and(isNull(events.archivedAt), gte(events.date, start), lt(events.date, end)))
    .orderBy(asc(events.date));

  const months: Record<number, typeof rows> = {};
  for (let m = 0; m < 12; m++) months[m] = [];
  for (const row of rows) months[row.date.getUTCMonth()].push(row);

  return {
    year,
    months: Object.entries(months).map(([month, monthEvents]) => ({
      month: Number(month) + 1,
      events: monthEvents,
    })),
  };
}

export const plannerService = { getYear };
