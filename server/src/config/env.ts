import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// Single source of truth: the repo-root .env (not a per-workspace copy).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string(),
  UPLOAD_DIR: z.string().default('./uploads'),
  EMAIL_TRANSPORT: z.enum(['console', 'file']).default('console'),
  EMAIL_FROM: z.string().default('noreply@example.com'),

  // Single-admin auth — see server/src/services/authService.ts. No external
  // identity provider: this is a personal-use app with exactly one account.
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters — generate one with `openssl rand -hex 48`'),
  JWT_EXPIRES_IN: z.string().default('30d'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
