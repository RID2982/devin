import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../lib/AppError';
import { env } from '../config/env';
import { authService } from '../services/authService';
import { logger } from '../lib/logger';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

interface TokenPayload {
  sub: string;
  email: string;
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing bearer token');
    }
    const token = authHeader.slice('Bearer '.length);

    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    const user = await authService.findById(payload.sub);
    if (!user) throw AppError.unauthorized('Unknown user');

    req.user = user;
    next();
  } catch (err) {
    logger.debug({ err }, 'Auth failed');
    next(AppError.unauthorized('Invalid or expired token'));
  }
}
