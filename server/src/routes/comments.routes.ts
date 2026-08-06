import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { commentsController } from '../controllers/commentsController';

export const commentsRouter = Router();

commentsRouter.get('/', asyncHandler(commentsController.list));
commentsRouter.post('/', asyncHandler(commentsController.create));
commentsRouter.patch('/:id', asyncHandler(commentsController.update));
commentsRouter.delete('/:id', asyncHandler(commentsController.remove));
