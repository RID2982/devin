import type { Request, Response } from 'express';
import { plannerService } from '../services/plannerService';

export async function getYear(req: Request, res: Response) {
  res.json(await plannerService.getYear(Number(req.params.year)));
}

export const plannerController = { getYear };
