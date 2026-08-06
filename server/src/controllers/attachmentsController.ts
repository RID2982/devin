import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response } from 'express';
import { AppError } from '../lib/AppError';
import { env } from '../config/env';
import { attachmentsService } from '../services/attachmentsService';

export async function list(req: Request, res: Response) {
  res.json(await attachmentsService.listFor(req.query.eventId as string | undefined, req.query.taskId as string | undefined));
}

export async function upload(req: Request, res: Response) {
  if (!req.file) throw AppError.badRequest('No file uploaded (expected multipart field "file")');
  const row = await attachmentsService.create(req.file, req.body.eventId, req.body.taskId, req.user?.id);
  res.status(201).json(row);
}

export async function download(req: Request, res: Response) {
  const attachment = await attachmentsService.getById(req.params.id);
  if (!attachment) throw AppError.notFound('Attachment', req.params.id);

  const filePath = path.resolve(env.UPLOAD_DIR, attachment.storedPath);
  if (!fs.existsSync(filePath)) {
    throw AppError.notFound('Attachment file on disk', attachment.filename);
  }

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.filename)}"`);
  res.download(filePath, attachment.filename);
}

export async function remove(req: Request, res: Response) {
  await attachmentsService.remove(req.params.id);
  res.status(204).send();
}

export const attachmentsController = { list, upload, download, remove };
