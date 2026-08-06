import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { plannerController } from '../controllers/plannerController';

export const plannerRouter = Router();

plannerRouter.get('/:year', asyncHandler(plannerController.getYear));
