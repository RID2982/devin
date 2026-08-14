import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { attendanceController } from '../controllers/attendanceController';

export const attendanceRouter = Router();

attendanceRouter.get('/', asyncHandler(attendanceController.list));
attendanceRouter.patch('/:eventId/:personId', asyncHandler(attendanceController.mark));
