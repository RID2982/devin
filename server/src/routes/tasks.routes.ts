import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { tasksController } from '../controllers/tasksController';
import { tagsController } from '../controllers/tagsController';

export const tasksRouter = Router();

tasksRouter.get('/', asyncHandler(tasksController.list));
tasksRouter.post('/', asyncHandler(tasksController.create));
tasksRouter.get('/:id', asyncHandler(tasksController.getOne));
tasksRouter.patch('/:id', asyncHandler(tasksController.update));
tasksRouter.patch('/:id/status', asyncHandler(tasksController.setStatus));
tasksRouter.delete('/:id', asyncHandler(tasksController.archive));
tasksRouter.post('/:id/restore', asyncHandler(tasksController.restore));
tasksRouter.post('/:id/assignees/:personId', asyncHandler(tasksController.addAssignee));
tasksRouter.delete('/:id/assignees/:personId', asyncHandler(tasksController.removeAssignee));
tasksRouter.post('/:id/dependencies/:dependsOnId', asyncHandler(tasksController.addDependency));
tasksRouter.delete('/:id/dependencies/:dependsOnId', asyncHandler(tasksController.removeDependency));
tasksRouter.post('/:id/tags/:tagId', asyncHandler(tagsController.attachToTask));
tasksRouter.delete('/:id/tags/:tagId', asyncHandler(tagsController.detachFromTask));
