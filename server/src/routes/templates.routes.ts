import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { templatesController } from '../controllers/templatesController';

export const templatesRouter = Router();

templatesRouter.get('/', asyncHandler(templatesController.list));
templatesRouter.post('/', asyncHandler(templatesController.create));
templatesRouter.get('/:id', asyncHandler(templatesController.getOne));
templatesRouter.patch('/:id', asyncHandler(templatesController.update));
templatesRouter.delete('/:id', asyncHandler(templatesController.archive));
templatesRouter.post('/:id/items', asyncHandler(templatesController.addItem));
templatesRouter.delete('/:id/items/:itemId', asyncHandler(templatesController.removeItem));
