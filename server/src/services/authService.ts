import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { db, INDEXES } from '../lib/db';
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

/** Finds (or lazily creates) the single admin's app_users item. */
async function getOrCreateAdminUser() {
  const [indexed] = await db.appUsers.queryIndex(INDEXES.appUsersByEmail, env.ADMIN_EMAIL, { limit: 1 });
  if (indexed) return indexed;

  // A GSI is eventually consistent, so a miss here does not prove the row is
  // absent — and DynamoDB has no unique constraint to catch a double insert.
  // The table holds exactly one admin, so confirming with a consistent read is
  // cheap insurance against creating a second one on a concurrent first login.
  const existing = (await db.appUsers.scan({ ConsistentRead: true })).find(
    (user) => user.email === env.ADMIN_EMAIL,
  );
  if (existing) return existing;

  return db.appUsers.create({ email: env.ADMIN_EMAIL, name: 'Admin' });
}

export async function login(email: string, password: string) {
  const emailMatches = timingSafeEqual(email.trim().toLowerCase(), env.ADMIN_EMAIL.toLowerCase());
  const passwordMatches = timingSafeEqual(password, env.ADMIN_PASSWORD);

  if (!emailMatches || !passwordMatches) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const user = await getOrCreateAdminUser();
  const token = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  return { token, user };
}

export async function findById(id: string) {
  return db.appUsers.getById(id);
}

export const authService = { login, findById };
