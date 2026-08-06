import type { Request, Response } from 'express';
import { checklistService } from '../services/checklistService';
import { createChecklistItemSchema, reorderChecklistSchema, updateChecklistItemSchema } from '../validators/checklist.schema';

export async function list(req: Request, res: Response) {
  res.json(await checklistService.listFor(req.query.eventId as string | undefined, req.query.taskId as string | undefined));
}
export async function create(req: Request, res: Response) {
  res.status(201).json(await checklistService.create(createChecklistItemSchema.parse(req.body), req.user?.id));
}
export async function update(req: Request, res: Response) {
  res.json(await checklistService.update(req.params.id, updateChecklistItemSchema.parse(req.body), req.user?.id));
}
export async function remove(req: Request, res: Response) {
  await checklistService.remove(req.params.id);
  res.status(204).send();
}
export async function reorder(req: Request, res: Response) {
  res.json(await checklistService.reorder(reorderChecklistSchema.parse(req.body).items));
}

export const checklistController = { list, create, update, remove, reorder };
