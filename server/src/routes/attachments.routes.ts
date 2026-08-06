import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { attachmentsController } from '../controllers/attachmentsController';
import { upload } from '../middleware/upload';

export const attachmentsRouter = Router();

attachmentsRouter.get('/', asyncHandler(attachmentsController.list));
attachmentsRouter.post('/', upload.single('file'), asyncHandler(attachmentsController.upload));
attachmentsRouter.get('/:id/download', asyncHandler(attachmentsController.download));
attachmentsRouter.delete('/:id', asyncHandler(attachmentsController.remove));
