import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { notificationsController } from '../controllers/notificationsController';

export const notificationsRouter = Router();

notificationsRouter.get('/', asyncHandler(notificationsController.list));
notificationsRouter.patch('/:id/read', asyncHandler(notificationsController.markRead));
