import { db, INDEXES } from '../lib/db';
import { AppError } from '../lib/AppError';

export async function listFor(userId: string) {
  // (userId, createdAt) is the index key, so newest-first is a reverse Query.
  return db.notifications.queryIndex(INDEXES.notificationsByUser, userId, { ascending: false });
}

export async function markRead(id: string) {
  const row = await db.notifications.updateById(id, { isRead: true });
  if (!row) throw AppError.notFound('Notification', id);
  return row;
}

export const notificationsService = { listFor, markRead };
