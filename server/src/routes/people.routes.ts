import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { peopleController } from '../controllers/peopleController';

export const peopleRouter = Router();

peopleRouter.get('/', asyncHandler(peopleController.list));
peopleRouter.post('/', asyncHandler(peopleController.create));
peopleRouter.get('/:id', asyncHandler(peopleController.getOne));
peopleRouter.patch('/:id', asyncHandler(peopleController.update));
peopleRouter.delete('/:id', asyncHandler(peopleController.archive));
peopleRouter.post('/:id/restore', asyncHandler(peopleController.restore));
