import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { attentionController } from '../controllers/attentionController';

export const attentionRouter = Router();

attentionRouter.get('/', asyncHandler(attentionController.getAttentionItems));
