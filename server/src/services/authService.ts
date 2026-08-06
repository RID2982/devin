import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db, schema } from '../lib/db';
import { AppError } from '../lib/AppError';
import { env } from '../config/env';

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Buffers must be equal length for timingSafeEqual; pad so length itself doesn't leak via a throw.
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Finds (or lazily creates) the single admin's app_users row. */
async function getOrCreateAdminUser() {
  const [existing] = await db.select().from(schema.appUsers).where(eq(schema.appUsers.email, env.ADMIN_EMAIL)).limit(1);
  if (existing) return existing;

  const [created] = await db.insert(schema.appUsers).values({ email: env.ADMIN_EMAIL, name: 'Admin' }).returning();
  return created;
}

export async function login(email: string, password: string) {
  const emailMatches = timingSafeEqual(email.trim().toLowerCase(), env.ADMIN_EMAIL.toLowerCase());
  const passwordMatches = timingSafeEqual(password, env.ADMIN_PASSWORD);

  if (!emailMatches || !passwordMatches) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const user = await getOrCreateAdminUser();
  const token = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

  return { token, user };
}

export async function findById(id: string) {
  const [user] = await db.select().from(schema.appUsers).where(eq(schema.appUsers.id, id)).limit(1);
  return user;
}

export const authService = { login, findById };
