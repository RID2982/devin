import type { Request, Response } from 'express';
import { attentionService } from '../services/attentionService';

export async function getAttentionItems(_req: Request, res: Response) {
  res.json(await attentionService.getAttentionItems());
}

export const attentionController = { getAttentionItems };
