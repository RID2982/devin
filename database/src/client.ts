import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Single source of truth: the repo-root .env (not a per-workspace copy).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '../../.env') });

export const AWS_REGION = process.env.AWS_REGION ?? 'us-east-1';

/**
 * Set for DynamoDB Local (docker-compose brings it up on :8000). Leave unset in
 * AWS and the SDK talks to the real regional endpoint with the ambient
 * credentials (env vars, shared profile, or the instance/task role).
 */
export const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || undefined;

/** DynamoDB table names are account+region global, so everything is namespaced. */
export const TABLE_PREFIX = process.env.DYNAMODB_TABLE_PREFIX ?? 'eventmgmt_';

export function tableName(name: string): string {
  return `${TABLE_PREFIX}${name}`;
}

// DynamoDB Local rejects requests with no credentials at all, but does not check
// them — hence the dummy fallback, which never applies against real AWS.
const credentials = DYNAMODB_ENDPOINT
  ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'local',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'local',
    }
  : undefined;

export const dynamoClient = new DynamoDBClient({
  region: AWS_REGION,
  ...(DYNAMODB_ENDPOINT ? { endpoint: DYNAMODB_ENDPOINT } : {}),
  ...(credentials ? { credentials } : {}),
});

export const documentClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    // Attributes we mean to be absent are dropped rather than written as NULL —
    // required for GSI key attributes, which DynamoDB rejects if typed NULL.
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export type DocumentClient = typeof documentClient;
