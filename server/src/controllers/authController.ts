import type { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/AppError';
import { authService } from '../services/authService';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  const { token, user } = await authService.login(email, password);
  res.json({ token, user });
}

export async function session(req: Request, res: Response) {
  if (!req.user) throw AppError.unauthorized();
  res.json({ user: req.user });
}

export const authController = { login, session };
