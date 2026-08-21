import pg from 'pg';
import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { documentClient, tableName, TABLE_PREFIX } from './client';
import { TABLES, type TableDef } from './schema';
import { Table } from './table';

/**
 * One-time data migration: copies every row out of the old Postgres database
 * into the matching DynamoDB table.
 *
 * Table names and row contents are preserved exactly; only the column *naming*
 * is translated, since Postgres stored snake_case and the API has always spoken
 * camelCase (Drizzle did that mapping before). Dates arrive from `pg` as `Date`
 * objects and `numeric` as strings, which is precisely what the Table wrapper
 * expects — so values survive the trip unchanged.
 *
 *   DATABASE_URL=postgres://... npm run db:import-postgres -w database
 *
 * Re-running is safe: writes are keyed puts, so a second pass overwrites rather
 * than duplicates. Pass --dry-run to report what would be copied.
 */

const dryRun = process.argv.includes('--dry-run');
const BATCH_SIZE = 25;

function toCamelCase(column: string): string {
  return column.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

function toRow(pgRow: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [column, value] of Object.entries(pgRow)) {
    row[toCamelCase(column)] = value;
  }
  return row;
}

/** Writes in BatchWriteItem-sized chunks, retrying whatever DynamoDB defers. */
async function writeAll(def: TableDef, rows: Record<string, unknown>[]): Promise<void> {
  const table = new Table(def);
  const name = tableName(def.name);
  // Reuse the Table's own encoding (defaults, date -> ISO, index-key null handling)
  // without issuing one PutItem per row.
  const items = rows.map((row) => table.encodeForImport(row));

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    let unprocessed: Record<string, { PutRequest: { Item: Record<string, unknown> } }[]> = {
      [name]: items.slice(i, i + BATCH_SIZE).map((Item) => ({ PutRequest: { Item } })),
    };

    while (Object.keys(unprocessed).length) {
      const response = await documentClient.send(new BatchWriteCommand({ RequestItems: unprocessed }));
      unprocessed = (response.UnprocessedItems ?? {}) as typeof unprocessed;
    }
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      'DATABASE_URL is not set.\n' +
        'Point it at the Postgres database you are migrating away from, e.g.\n' +
        '  DATABASE_URL=postgres://user:pass@localhost:5432/rotaract npm run db:import-postgres -w database',
    );
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 10_000 });

  console.log(
    `Importing Postgres -> DynamoDB (prefix "${TABLE_PREFIX}")${dryRun ? ' [dry run]' : ''}...`,
  );

  let total = 0;
  try {
    for (const def of Object.values(TABLES)) {
      let pgRows: Record<string, unknown>[];
      try {
        const result = await pool.query(`SELECT * FROM "${def.name}"`);
        pgRows = result.rows as Record<string, unknown>[];
      } catch (err) {
        // A table that never existed in the source database is not an error —
        // it just means there is nothing to carry over.
        if ((err as { code?: string }).code === '42P01') {
          console.log(`  skip    ${def.name} (no such table in Postgres)`);
          continue;
        }
        throw err;
      }

      if (!pgRows.length) {
        console.log(`  empty   ${def.name}`);
        continue;
      }

      const rows = pgRows.map(toRow);
      if (!dryRun) await writeAll(def, rows);

      total += rows.length;
      console.log(`  ${dryRun ? 'would copy' : 'copied '} ${String(rows.length).padStart(5)}  ${def.name}`);
    }
  } finally {
    await pool.end();
  }

  console.log(
    dryRun
      ? `Dry run complete — ${total} rows would be copied. Re-run without --dry-run to write them.`
      : `Import complete — ${total} rows copied into DynamoDB.`,
  );
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
