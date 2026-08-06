import type { Request, Response } from 'express';
import { activityService } from '../services/activityService';

export async function list(req: Request, res: Response) {
  res.json(await activityService.list(req.query.eventId as string | undefined));
}

export const activityController = { list };
