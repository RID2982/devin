import {
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
  UpdateTableCommand,
  waitUntilTableExists,
  type AttributeDefinition,
  type CreateTableCommandInput,
  type GlobalSecondaryIndex,
  type KeySchemaElement,
} from '@aws-sdk/client-dynamodb';
import { DYNAMODB_ENDPOINT, dynamoClient, tableName, TABLE_PREFIX } from './client';
import { TABLES, type TableDef } from './schema';

// DynamoDB has no DDL migrations to replay — creating a table *is* the schema.
// This script is idempotent: it creates what's missing and adds any GSI that was
// declared after the table was first created, so it is safe to re-run.

const BILLING_MODE = (process.env.DYNAMODB_BILLING_MODE ?? 'PAY_PER_REQUEST') as
  | 'PAY_PER_REQUEST'
  | 'PROVISIONED';

// Only consulted when DYNAMODB_BILLING_MODE=PROVISIONED. DynamoDB Local ignores
// billing mode entirely but still requires throughput numbers on PROVISIONED.
const throughput =
  BILLING_MODE === 'PROVISIONED'
    ? {
        ReadCapacityUnits: Number(process.env.DYNAMODB_READ_CAPACITY ?? 5),
        WriteCapacityUnits: Number(process.env.DYNAMODB_WRITE_CAPACITY ?? 5),
      }
    : undefined;

/** Every attribute used as a table or index key must be declared, and only those. */
function attributeDefinitions(def: TableDef): AttributeDefinition[] {
  const keyColumns = new Set<string>([def.hashKey]);
  if (def.rangeKey) keyColumns.add(def.rangeKey);
  for (const index of def.indexes ?? []) {
    keyColumns.add(index.hashKey);
    if (index.rangeKey) keyColumns.add(index.rangeKey);
  }

  return [...keyColumns].map((column) => {
    const type = def.columns[column]?.type;
    // Dates are stored as ISO strings precisely so they can key an index.
    return { AttributeName: column, AttributeType: type === 'number' ? 'N' : 'S' };
  });
}

function keySchema(hashKey: string, rangeKey?: string): KeySchemaElement[] {
  const schema: KeySchemaElement[] = [{ AttributeName: hashKey, KeyType: 'HASH' }];
  if (rangeKey) schema.push({ AttributeName: rangeKey, KeyType: 'RANGE' });
  return schema;
}

function globalSecondaryIndexes(def: TableDef): GlobalSecondaryIndex[] {
  return (def.indexes ?? []).map((index) => ({
    IndexName: index.name,
    KeySchema: keySchema(index.hashKey, index.rangeKey),
    Projection: { ProjectionType: 'ALL' },
    ...(throughput ? { ProvisionedThroughput: throughput } : {}),
  }));
}

async function describe(name: string) {
  try {
    const result = await dynamoClient.send(new DescribeTableCommand({ TableName: name }));
    return result.Table;
  } catch (err) {
    if (err instanceof ResourceNotFoundException) return undefined;
    throw err;
  }
}

async function createTable(def: TableDef): Promise<void> {
  const name = tableName(def.name);

  const input: CreateTableCommandInput = {
    TableName: name,
    KeySchema: keySchema(def.hashKey, def.rangeKey),
    AttributeDefinitions: attributeDefinitions(def),
    BillingMode: BILLING_MODE,
    ...(throughput ? { ProvisionedThroughput: throughput } : {}),
  };

  const indexes = globalSecondaryIndexes(def);
  if (indexes.length) input.GlobalSecondaryIndexes = indexes;

  await dynamoClient.send(new CreateTableCommand(input));
  await waitUntilTableExists({ client: dynamoClient, maxWaitTime: 120 }, { TableName: name });
  console.log(`  created ${name}${indexes.length ? ` (+${indexes.length} index)` : ''}`);
}

/** A GSI added to schema.ts after the table already existed. One per UpdateTable call. */
async function addMissingIndexes(def: TableDef, existingIndexNames: Set<string>): Promise<void> {
  const name = tableName(def.name);

  for (const index of globalSecondaryIndexes(def)) {
    if (existingIndexNames.has(index.IndexName!)) continue;

    await dynamoClient.send(
      new UpdateTableCommand({
        TableName: name,
        AttributeDefinitions: attributeDefinitions(def),
        GlobalSecondaryIndexUpdates: [{ Create: index }],
      }),
    );
    console.log(`  added index ${index.IndexName} to ${name}`);
  }
}

async function main() {
  const target = DYNAMODB_ENDPOINT ?? 'AWS';
  console.log(`Creating DynamoDB tables on ${target} (prefix "${TABLE_PREFIX}")...`);

  let created = 0;
  for (const def of Object.values(TABLES)) {
    const name = tableName(def.name);
    const existing = await describe(name);

    if (!existing) {
      await createTable(def);
      created += 1;
      continue;
    }

    const indexNames = new Set((existing.GlobalSecondaryIndexes ?? []).map((i) => i.IndexName!));
    await addMissingIndexes(def, indexNames);
    console.log(`  exists  ${name}`);
  }

  console.log(
    `Migration complete — ${Object.keys(TABLES).length} tables (${created} created, ${
      Object.keys(TABLES).length - created
    } already present).`,
  );
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
