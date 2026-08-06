import type { Request } from 'express';
import type { PaginationMeta } from '@app/shared';

export interface ListQuery {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDir: 'asc' | 'desc';
  search?: string;
  archived: boolean;
  filters: Record<string, string>;
}

const RESERVED_KEYS = new Set(['page', 'pageSize', 'sortBy', 'sortDir', 'search', 'archived']);

/** Parses common list-endpoint query params; anything not reserved is returned as a raw filter. */
export function parseListQuery(req: Request): ListQuery {
  const q = req.query;
  const page = Math.max(1, Number(q.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 20));
  const sortDir = q.sortDir === 'desc' ? 'desc' : 'asc';

  const filters: Record<string, string> = {};
  for (const [key, value] of Object.entries(q)) {
    if (!RESERVED_KEYS.has(key) && typeof value === 'string' && value.length > 0) {
      filters[key] = value;
    }
  }

  return {
    page,
    pageSize,
    sortBy: typeof q.sortBy === 'string' ? q.sortBy : undefined,
    sortDir,
    search: typeof q.search === 'string' ? q.search : undefined,
    archived: q.archived === 'true',
    filters,
  };
}

export function buildMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
