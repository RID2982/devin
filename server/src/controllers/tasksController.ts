import type { Request, Response } from 'express';
import { parseListQuery } from '../lib/listQuery';
import { tasksService } from '../services/tasksService';
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema } from '../validators/tasks.schema';

export async function list(req: Request, res: Response) {
  res.json(await tasksService.list(parseListQuery(req)));
}

export async function getOne(req: Request, res: Response) {
  res.json(await tasksService.getById(req.params.id));
}

export async function create(req: Request, res: Response) {
  const input = createTaskSchema.parse(req.body);
  res.status(201).json(await tasksService.create(input, req.user?.id));
}

export async function update(req: Request, res: Response) {
  const input = updateTaskSchema.parse(req.body);
  res.json(await tasksService.update(req.params.id, input, req.user?.id));
}

export async function setStatus(req: Request, res: Response) {
  const { status } = updateTaskStatusSchema.parse(req.body);
  res.json(await tasksService.setStatus(req.params.id, status, req.user?.id));
}

export async function archive(req: Request, res: Response) {
  res.json(await tasksService.archive(req.params.id, req.user?.id));
}

export async function restore(req: Request, res: Response) {
  res.json(await tasksService.restore(req.params.id, req.user?.id));
}

export async function addAssignee(req: Request, res: Response) {
  res.json(await tasksService.addAssignee(req.params.id, req.params.personId, req.user?.id));
}

export async function removeAssignee(req: Request, res: Response) {
  res.json(await tasksService.removeAssignee(req.params.id, req.params.personId));
}

export async function addDependency(req: Request, res: Response) {
  res.json(await tasksService.addDependency(req.params.id, req.params.dependsOnId));
}

export async function removeDependency(req: Request, res: Response) {
  res.json(await tasksService.removeDependency(req.params.id, req.params.dependsOnId));
}

export const tasksController = { list, getOne, create, update, setStatus, archive, restore, addAssignee, removeAssignee, addDependency, removeDependency };
