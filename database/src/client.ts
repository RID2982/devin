import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Single source of truth: the repo-root .env (not a per-workspace copy).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '../../.env') });

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://myuser:mypassword@localhost:5432/rotaract';

export const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });

export type Database = typeof db;
