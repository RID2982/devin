import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { reportsController } from '../controllers/reportsController';

export const reportsRouter = Router();

reportsRouter.get('/monthly', asyncHandler(reportsController.monthly));
reportsRouter.get('/monthly/export', asyncHandler(reportsController.exportMonthlyCsv));
reportsRouter.get('/event-summary/:eventId', asyncHandler(reportsController.eventSummary));
reportsRouter.get('/productivity', asyncHandler(reportsController.productivity));
reportsRouter.get('/productivity/export', asyncHandler(reportsController.exportProductivityCsv));
