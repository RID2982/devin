import {
  DeleteTableCommand,
  ResourceNotFoundException,
  waitUntilTableNotExists,
} from '@aws-sdk/client-dynamodb';
import { dynamoClient, tableName, TABLE_PREFIX } from './client';
import { TABLES } from './schema';

/**
 * Deletes every table outright. Destructive and unrecoverable — `db:migrate`
 * recreates the (empty) tables afterwards. Guarded so it can't be pointed at a
 * real AWS account by accident: pass `--force` to mean it.
 */

const force = process.argv.includes('--force');
const isLocal = Boolean(process.env.DYNAMODB_ENDPOINT);

async function main() {
  if (!isLocal && !force) {
    console.error(
      'Refusing to drop tables against real AWS DynamoDB.\n' +
        'DYNAMODB_ENDPOINT is unset, so this would delete production data.\n' +
        'Re-run with --force if that is genuinely what you want.',
    );
    process.exit(1);
  }

  console.log(`Dropping ${Object.keys(TABLES).length} tables (prefix "${TABLE_PREFIX}")...`);

  for (const def of Object.values(TABLES)) {
    const name = tableName(def.name);
    try {
      await dynamoClient.send(new DeleteTableCommand({ TableName: name }));
      await waitUntilTableNotExists({ client: dynamoClient, maxWaitTime: 120 }, { TableName: name });
      console.log(`  dropped ${name}`);
    } catch (err) {
      if (err instanceof ResourceNotFoundException) {
        console.log(`  absent  ${name}`);
        continue;
      }
      throw err;
    }
  }

  console.log('All tables dropped. Run `npm run db:migrate` to recreate them.');
}

main().catch((err) => {
  console.error('Drop failed:', err);
  process.exit(1);
});
