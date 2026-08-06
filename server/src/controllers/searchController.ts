import type { Request, Response } from 'express';
import { AppError } from '../lib/AppError';
import { searchService } from '../services/searchService';

export async function search(req: Request, res: Response) {
  const q = req.query.q;
  if (typeof q !== 'string' || q.trim().length === 0) throw AppError.badRequest('q query param is required');
  res.json(await searchService.search(q.trim()));
}

export const searchController = { search };
