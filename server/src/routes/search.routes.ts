import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { searchController } from '../controllers/searchController';

export const searchRouter = Router();

searchRouter.get('/', asyncHandler(searchController.search));
