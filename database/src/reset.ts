import { BatchWriteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { documentClient, tableName, TABLE_PREFIX } from './client';
import { TABLES, type TableDef } from './schema';

/**
 * Empties every table without dropping it — the TRUNCATE equivalent.
 *
 * DynamoDB has no truncate, so this scans keys and deletes them in batches of 25
 * (the BatchWriteItem limit). For a full teardown use `npm run db:drop` instead.
 */

const BATCH_SIZE = 25;

function keyAttributes(def: TableDef): string[] {
  return def.rangeKey ? [def.hashKey, def.rangeKey] : [def.hashKey];
}

async function clearTable(def: TableDef): Promise<number> {
  const name = tableName(def.name);
  const attributes = keyAttributes(def);
  const names = Object.fromEntries(attributes.map((attribute, i) => [`#k${i}`, attribute]));

  let deleted = 0;
  let startKey: Record<string, unknown> | undefined;

  do {
    const result = await documentClient.send(
      new ScanCommand({
        TableName: name,
        ProjectionExpression: Object.keys(names).join(', '),
        ExpressionAttributeNames: names,
        ExclusiveStartKey: startKey,
      }),
    );

    const keys = (result.Items ?? []) as Record<string, string>[];
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE);
      let unprocessed = {
        [name]: batch.map((key) => ({ DeleteRequest: { Key: key } })),
      };

      // BatchWriteItem can return work it declined to do; keep at it.
      while (Object.keys(unprocessed).length) {
        const response = await documentClient.send(new BatchWriteCommand({ RequestItems: unprocessed }));
        unprocessed = (response.UnprocessedItems ?? {}) as typeof unprocessed;
      }
      deleted += batch.length;
    }

    startKey = result.LastEvaluatedKey;
  } while (startKey);

  return deleted;
}

async function main() {
  const tables = Object.values(TABLES);
  console.log(`Emptying ${tables.length} tables (prefix "${TABLE_PREFIX}")...`);

  let total = 0;
  for (const def of tables) {
    const deleted = await clearTable(def);
    total += deleted;
    if (deleted) console.log(`  ${tableName(def.name)}: ${deleted} items deleted`);
  }

  console.log(`Database reset complete — ${total} items removed, every table is now empty.`);
}

main().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
