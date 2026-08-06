import path from 'node:path';
import { eq } from 'drizzle-orm';
import { db, schema } from '../lib/db';
import { AppError } from '../lib/AppError';
import { env } from '../config/env';
import { activityLogService } from './activityLogService';

const { attachments } = schema;

export async function listFor(eventId?: string, taskId?: string) {
  if (eventId) return db.select().from(attachments).where(eq(attachments.eventId, eventId));
  if (taskId) return db.select().from(attachments).where(eq(attachments.taskId, taskId));
  throw AppError.badRequest('eventId or taskId query param is required');
}

export async function create(file: Express.Multer.File, eventId: string | undefined, taskId: string | undefined, actorUserId?: string) {
  const relativePath = path.relative(path.resolve(env.UPLOAD_DIR), file.path).split(path.sep).join('/');

  const [row] = await db
    .insert(attachments)
    .values({
      filename: file.originalname,
      storedPath: relativePath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      eventId,
      taskId,
      uploadedByUserId: actorUserId,
    })
    .returning();

  await activityLogService.record({
    action: 'FILE_UPLOADED',
    summary: `File "${file.originalname}" uploaded`,
    eventId,
    taskId,
    actorUserId,
  });

  return row;
}

export async function getById(id: string) {
  const [row] = await db.select().from(attachments).where(eq(attachments.id, id)).limit(1);
  if (!row) throw AppError.notFound('Attachment', id);
  return row;
}

export async function remove(id: string) {
  await db.delete(attachments).where(eq(attachments.id, id));
}

export const attachmentsService = { listFor, create, getById, remove };
