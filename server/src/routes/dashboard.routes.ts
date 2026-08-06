import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { dashboardController } from '../controllers/dashboardController';

export const dashboardRouter = Router();

dashboardRouter.get('/overview', asyncHandler(dashboardController.overview));
