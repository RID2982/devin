import path from 'node:path';
import { db, INDEXES } from '../lib/db';
import { AppError } from '../lib/AppError';
import { env } from '../config/env';
import { activityLogService } from './activityLogService';

export async function listFor(eventId?: string, taskId?: string) {
  if (eventId) return db.attachments.queryIndex(INDEXES.attachmentsByEvent, eventId);
  if (taskId) return db.attachments.queryIndex(INDEXES.attachmentsByTask, taskId);
  throw AppError.badRequest('eventId or taskId query param is required');
}

export async function create(
  file: Express.Multer.File,
  eventId: string | undefined,
  taskId: string | undefined,
  actorUserId?: string,
) {
  const relativePath = path.relative(path.resolve(env.UPLOAD_DIR), file.path).split(path.sep).join('/');

  const row = await db.attachments.create({
    filename: file.originalname,
    storedPath: relativePath,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    eventId,
    taskId,
    uploadedByUserId: actorUserId,
  });

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
  const row = await db.attachments.getById(id);
  if (!row) throw AppError.notFound('Attachment', id);
  return row;
}

export async function remove(id: string) {
  await db.attachments.deleteById(id);
}

export const attachmentsService = { listFor, create, getById, remove };
