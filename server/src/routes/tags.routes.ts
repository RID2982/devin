import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { tagsController } from '../controllers/tagsController';

export const tagsRouter = Router();

tagsRouter.get('/', asyncHandler(tagsController.list));
tagsRouter.post('/', asyncHandler(tagsController.create));
