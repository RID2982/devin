import { desc, eq } from 'drizzle-orm';
import { db, schema } from '../lib/db';

const { activityLogs } = schema;

export async function list(eventId: string | undefined, limit = 50) {
  const query = db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
  if (eventId) return db.select().from(activityLogs).where(eq(activityLogs.eventId, eventId)).orderBy(desc(activityLogs.createdAt)).limit(limit);
  return query;
}

export const activityService = { list };
