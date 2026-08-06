import type { Request, Response } from 'express';
import { z } from 'zod';
import { tagsService } from '../services/tagsService';

const createTagSchema = z.object({ name: z.string().min(1).max(100), color: z.string().max(20).optional() });

export async function list(_req: Request, res: Response) {
  res.json(await tagsService.list());
}
export async function create(req: Request, res: Response) {
  const input = createTagSchema.parse(req.body);
  res.status(201).json(await tagsService.create(input.name, input.color));
}
export async function attachToEvent(req: Request, res: Response) {
  await tagsService.attachToEvent(req.params.id, req.params.tagId);
  res.status(204).send();
}
export async function detachFromEvent(req: Request, res: Response) {
  await tagsService.detachFromEvent(req.params.id, req.params.tagId);
  res.status(204).send();
}
export async function attachToTask(req: Request, res: Response) {
  await tagsService.attachToTask(req.params.id, req.params.tagId);
  res.status(204).send();
}
export async function detachFromTask(req: Request, res: Response) {
  await tagsService.detachFromTask(req.params.id, req.params.tagId);
  res.status(204).send();
}

export const tagsController = { list, create, attachToEvent, detachFromEvent, attachToTask, detachFromTask };
