import type { Request, Response } from 'express';
import { z } from 'zod';
import { commentsService } from '../services/commentsService';

const createCommentSchema = z
  .object({ body: z.string().min(1), eventId: z.string().uuid().optional(), taskId: z.string().uuid().optional() })
  .refine((v) => Boolean(v.eventId) !== Boolean(v.taskId), { message: 'Exactly one of eventId or taskId must be set' });

export async function list(req: Request, res: Response) {
  res.json(await commentsService.listFor(req.query.eventId as string | undefined, req.query.taskId as string | undefined));
}
export async function create(req: Request, res: Response) {
  res.status(201).json(await commentsService.create(createCommentSchema.parse(req.body), req.user?.id));
}
export async function update(req: Request, res: Response) {
  res.json(await commentsService.update(req.params.id, z.object({ body: z.string().min(1) }).parse(req.body).body));
}
export async function remove(req: Request, res: Response) {
  await commentsService.remove(req.params.id);
  res.status(204).send();
}

export const commentsController = { list, create, update, remove };
