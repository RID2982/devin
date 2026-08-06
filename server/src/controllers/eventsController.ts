import type { Request, Response } from 'express';
import { parseListQuery } from '../lib/listQuery';
import { eventsService } from '../services/eventsService';
import { createEventSchema, updateEventSchema } from '../validators/events.schema';

export async function list(req: Request, res: Response) {
  res.json(await eventsService.list(parseListQuery(req)));
}

export async function getOne(req: Request, res: Response) {
  res.json(await eventsService.getById(req.params.id));
}

export async function create(req: Request, res: Response) {
  const input = createEventSchema.parse(req.body);
  res.status(201).json(await eventsService.create(input, req.user?.id));
}

export async function update(req: Request, res: Response) {
  const input = updateEventSchema.parse(req.body);
  res.json(await eventsService.update(req.params.id, input, req.user?.id));
}

export async function archive(req: Request, res: Response) {
  res.json(await eventsService.archive(req.params.id, req.user?.id));
}

export async function restore(req: Request, res: Response) {
  res.json(await eventsService.restore(req.params.id, req.user?.id));
}

export async function applyTemplate(req: Request, res: Response) {
  res.json(await eventsService.applyTemplate(req.params.id, req.params.templateId, req.user?.id));
}

export async function timeline(req: Request, res: Response) {
  res.json(await eventsService.timeline(req.params.id));
}

export async function summary(req: Request, res: Response) {
  res.json(await eventsService.summary(req.params.id));
}

export async function addPerson(req: Request, res: Response) {
  res.json(await eventsService.addPerson(req.params.id, req.params.personId, req.body?.roleOnEvent, req.user?.id));
}

export async function removePerson(req: Request, res: Response) {
  res.json(await eventsService.removePerson(req.params.id, req.params.personId));
}

export const eventsController = { list, getOne, create, update, archive, restore, applyTemplate, timeline, summary, addPerson, removePerson };
