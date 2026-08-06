import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { notesController } from '../controllers/notesController';

export const notesRouter = Router();

notesRouter.get('/', asyncHandler(notesController.list));
notesRouter.post('/', asyncHandler(notesController.create));
notesRouter.patch('/:id', asyncHandler(notesController.update));
notesRouter.delete('/:id', asyncHandler(notesController.remove));
