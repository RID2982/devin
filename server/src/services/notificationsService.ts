import { desc, eq } from 'drizzle-orm';
import { db, schema } from '../lib/db';
import { AppError } from '../lib/AppError';

const { notifications } = schema;

export async function listFor(userId: string) {
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function markRead(id: string) {
  const [row] = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
  if (!row) throw AppError.notFound('Notification', id);
  return row;
}

export const notificationsService = { listFor, markRead };
