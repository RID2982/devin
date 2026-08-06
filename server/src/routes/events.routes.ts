import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { eventsController } from '../controllers/eventsController';
import { tagsController } from '../controllers/tagsController';

export const eventsRouter = Router();

eventsRouter.get('/', asyncHandler(eventsController.list));
eventsRouter.post('/', asyncHandler(eventsController.create));
eventsRouter.get('/:id', asyncHandler(eventsController.getOne));
eventsRouter.patch('/:id', asyncHandler(eventsController.update));
eventsRouter.delete('/:id', asyncHandler(eventsController.archive));
eventsRouter.post('/:id/restore', asyncHandler(eventsController.restore));
eventsRouter.post('/:id/apply-template/:templateId', asyncHandler(eventsController.applyTemplate));
eventsRouter.get('/:id/timeline', asyncHandler(eventsController.timeline));
eventsRouter.get('/:id/summary', asyncHandler(eventsController.summary));
eventsRouter.post('/:id/tags/:tagId', asyncHandler(tagsController.attachToEvent));
eventsRouter.delete('/:id/tags/:tagId', asyncHandler(tagsController.detachFromEvent));
eventsRouter.post('/:id/people/:personId', asyncHandler(eventsController.addPerson));
eventsRouter.delete('/:id/people/:personId', asyncHandler(eventsController.removePerson));
