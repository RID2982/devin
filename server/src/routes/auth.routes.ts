import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authController } from '../controllers/authController';

/** Mounted behind authMiddleware — POST /login is public and wired separately in app.ts. */
export const authRouter = Router();

authRouter.get('/session', asyncHandler(authController.session));
