import type { Event } from '@app/database';
import { db } from '../lib/db';
import { isArchived, sortByKey } from '../lib/query';

export async function getYear(year: number) {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const all = await db.events.all();
  const rows = sortByKey(
    all.filter((e) => !isArchived(e.archivedAt) && e.date >= start && e.date < end),
    'date',
  );

  const months: Record<number, Event[]> = {};
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
