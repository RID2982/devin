import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { calendarController } from '../controllers/calendarController';

export const calendarRouter = Router();

calendarRouter.get('/', asyncHandler(calendarController.getRange));
