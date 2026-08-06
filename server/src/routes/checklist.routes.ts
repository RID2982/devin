import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { checklistController } from '../controllers/checklistController';

export const checklistRouter = Router();

checklistRouter.get('/', asyncHandler(checklistController.list));
checklistRouter.post('/', asyncHandler(checklistController.create));
checklistRouter.patch('/reorder', asyncHandler(checklistController.reorder));
checklistRouter.patch('/:id', asyncHandler(checklistController.update));
checklistRouter.delete('/:id', asyncHandler(checklistController.remove));
