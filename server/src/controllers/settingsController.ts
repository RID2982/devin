import type { Request, Response } from 'express';
import { z } from 'zod';
import { settingsService } from '../services/settingsService';

export async function getAll(_req: Request, res: Response) {
  res.json(await settingsService.getAll());
}

export async function update(req: Request, res: Response) {
  const body = z.record(z.string(), z.unknown()).parse(req.body);
  let result;
  for (const [key, value] of Object.entries(body)) {
    result = await settingsService.set(key, value);
  }
  res.json(result ?? (await settingsService.getAll()));
}

export const settingsController = { getAll, update };
