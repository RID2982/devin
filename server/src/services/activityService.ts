import { db, INDEXES } from '../lib/db';
import { sortByKey } from '../lib/query';

export async function list(eventId: string | undefined, limit = 50) {
  // Per-event history is keyed (eventId + createdAt), so it comes back already
  // ordered newest-first straight from the index.
  if (eventId) {
    return db.activityLogs.queryIndex(INDEXES.activityLogsByEvent, eventId, {
      ascending: false,
      limit,
    });
  }

  const all = await db.activityLogs.all();
  return sortByKey(all, 'createdAt', 'desc').slice(0, limit);
}

export const activityService = { list };
