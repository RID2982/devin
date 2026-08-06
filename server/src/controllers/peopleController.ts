import type { Request, Response } from 'express';
import { parseListQuery } from '../lib/listQuery';
import { peopleService } from '../services/peopleService';
import { createPersonSchema, updatePersonSchema } from '../validators/people.schema';

export async function list(req: Request, res: Response) {
  res.json(await peopleService.list(parseListQuery(req)));
}
export async function getOne(req: Request, res: Response) {
  res.json(await peopleService.getById(req.params.id));
}
export async function create(req: Request, res: Response) {
  res.status(201).json(await peopleService.create(createPersonSchema.parse(req.body)));
}
export async function update(req: Request, res: Response) {
  res.json(await peopleService.update(req.params.id, updatePersonSchema.parse(req.body)));
}
export async function archive(req: Request, res: Response) {
  res.json(await peopleService.archive(req.params.id));
}
export async function restore(req: Request, res: Response) {
  res.json(await peopleService.restore(req.params.id));
}

export const peopleController = { list, getOne, create, update, archive, restore };
