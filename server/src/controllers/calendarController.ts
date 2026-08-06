import type { Request, Response } from 'express';
import { z } from 'zod';
import { calendarService } from '../services/calendarService';

const querySchema = z.object({ from: z.coerce.date(), to: z.coerce.date() });

export async function getRange(req: Request, res: Response) {
  const { from, to } = querySchema.parse(req.query);
  res.json(await calendarService.getRange(from, to));
}

export const calendarController = { getRange };
