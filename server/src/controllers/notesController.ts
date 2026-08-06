import type { Request, Response } from 'express';
import { z } from 'zod';
import { notesService } from '../services/notesService';

export async function list(req: Request, res: Response) {
  res.json(await notesService.listFor(req.query.eventId as string));
}
export async function create(req: Request, res: Response) {
  const input = z.object({ eventId: z.string().uuid(), title: z.string().optional(), bodyMarkdown: z.string().default('') }).parse(req.body);
  res.status(201).json(await notesService.create(input.eventId, input.title, input.bodyMarkdown));
}
export async function update(req: Request, res: Response) {
  const input = z.object({ title: z.string().optional(), bodyMarkdown: z.string().optional() }).parse(req.body);
  res.json(await notesService.update(req.params.id, input, req.user?.id));
}
export async function remove(req: Request, res: Response) {
  await notesService.remove(req.params.id);
  res.status(204).send();
}

export const notesController = { list, create, update, remove };
