import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { activityController } from '../controllers/activityController';

export const activityRouter = Router();

activityRouter.get('/', asyncHandler(activityController.list));
