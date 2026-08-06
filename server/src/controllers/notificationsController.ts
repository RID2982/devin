import type { Request, Response } from 'express';
import { AppError } from '../lib/AppError';
import { notificationsService } from '../services/notificationsService';

export async function list(req: Request, res: Response) {
  if (!req.user) throw AppError.unauthorized();
  res.json(await notificationsService.listFor(req.user.id));
}

export async function markRead(req: Request, res: Response) {
  res.json(await notificationsService.markRead(req.params.id));
}

export const notificationsController = { list, markRead };
