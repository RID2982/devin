import type { Request, Response } from 'express';
import { templatesService } from '../services/templatesService';
import { createTemplateItemSchema, createTemplateSchema, updateTemplateSchema } from '../validators/templates.schema';

export async function list(_req: Request, res: Response) {
  res.json(await templatesService.list());
}
export async function getOne(req: Request, res: Response) {
  res.json(await templatesService.getById(req.params.id));
}
export async function create(req: Request, res: Response) {
  res.status(201).json(await templatesService.create(createTemplateSchema.parse(req.body)));
}
export async function update(req: Request, res: Response) {
  res.json(await templatesService.update(req.params.id, updateTemplateSchema.parse(req.body)));
}
export async function archive(req: Request, res: Response) {
  res.json(await templatesService.archive(req.params.id));
}
export async function addItem(req: Request, res: Response) {
  const input = createTemplateItemSchema.parse(req.body);
  res.status(201).json(await templatesService.addItem(req.params.id, input.label, input.order));
}
export async function removeItem(req: Request, res: Response) {
  await templatesService.removeItem(req.params.itemId);
  res.status(204).send();
}

export const templatesController = { list, getOne, create, update, archive, addItem, removeItem };
