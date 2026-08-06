import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { settingsController } from '../controllers/settingsController';

export const settingsRouter = Router();

settingsRouter.get('/', asyncHandler(settingsController.getAll));
settingsRouter.patch('/', asyncHandler(settingsController.update));
