import type { TableDef } from '@app/database';

/**
 * The parts of SQL that DynamoDB has no answer for.
 *
 * Filtering on arbitrary columns, `ILIKE` search, sorting by whichever column
 * the UI asked for and OFFSET paging are all things the query planner used to
 * do. DynamoDB can only Query a key or Scan, so the repositories read the
 * candidate items and finish the job here — with the same semantics Postgres
 * had, which is the whole point of this module:
 *
 *  - `ILIKE '%term%'` is a case-insensitive substring test, and NULL never matches.
 *  - `ORDER BY` puts NULLs last ascending and first descending, as pg does.
 *  - Enum columns sort in *declaration* order (Low < Medium < High < Critical),
 *    not alphabetically — pg sorted enums by ordinal, and the UI depends on it.
 */

export type SortDirection = 'asc' | 'desc';

/** `column ILIKE '%term%'` */
export function ilike(value: unknown, term: string): boolean {
  if (typeof value !== 'string') return false;
  return value.toLowerCase().includes(term.toLowerCase());
}

/** True when any of the columns matches — the `or(ilike(...), ilike(...))` shape. */
export function ilikeAny(term: string, ...values: unknown[]): boolean {
  return values.some((value) => ilike(value, term));
}

function rank(value: unknown, enumValues?: readonly string[]): number | string | null {
  if (value === null || value === undefined) return null;
  if (enumValues && typeof value === 'string') {
    const index = enumValues.indexOf(value);
    return index === -1 ? enumValues.length : index;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value;
  return String(value);
}

function compareRanked(a: number | string, b: number | string): number {
  if (typeof a === 'string' || typeof b === 'string') {
    return String(a).localeCompare(String(b));
  }
  return a - b;
}

/**
 * Sorts a copy of `rows` by one column, reading the column's declared enum
 * ordering (if any) off the table definition.
 */
export function sortRows<T extends object>(
  rows: T[],
  table: TableDef,
  column: string,
  direction: SortDirection = 'asc',
): T[] {
  const enumValues = table.columns[column]?.enum;
  const sign = direction === 'desc' ? -1 : 1;

  return [...rows].sort((rowA, rowB) => {
    const a = rank((rowA as Record<string, unknown>)[column], enumValues);
    const b = rank((rowB as Record<string, unknown>)[column], enumValues);

    // NULLS LAST on ASC, NULLS FIRST on DESC — Postgres' default. Note this is
    // not the same as sorting nulls to one end and reversing: pg treats NULL as
    // larger than everything, so the direction carries it across.
    if (a === null && b === null) return 0;
    if (a === null) return sign;
    if (b === null) return -sign;

    return compareRanked(a, b) * sign;
  });
}

/** Sorts by a column that is always present, for the simple ORDER BY call sites. */
export function sortByKey<T extends object>(
  rows: T[],
  column: keyof T & string,
  direction: SortDirection = 'asc',
): T[] {
  return sortRows(rows, { name: '', hashKey: '', columns: {} }, column, direction);
}

/** LIMIT/OFFSET over an already-sorted list. */
export function paginate<T>(rows: T[], page: number, pageSize: number): T[] {
  const offset = (page - 1) * pageSize;
  return rows.slice(offset, offset + pageSize);
}

/** `WHERE col IS NULL` / `IS NOT NULL` for the archivedAt soft-delete columns. */
export function isArchived(value: Date | null | undefined): boolean {
  return value !== null && value !== undefined;
}
