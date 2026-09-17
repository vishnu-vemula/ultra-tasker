import { Router } from 'express';
import type { DealsController } from './deals.controller';
import type { AuthMiddleware } from '../../common/middleware/auth.middleware';

export function buildDealsRouter(controller: DealsController, auth: AuthMiddleware): Router {
  const router = Router();
  router.use(auth.requireAuth);
  router.patch('/reorder', controller.reorder);
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.get);
  router.patch('/:id', controller.update);
  router.patch('/:id/tags', controller.setTags);
  router.delete('/:id', controller.remove);
  router.post('/:id/items', controller.addItem);
  router.patch('/:id/items/:itemId', controller.updateItem);
  router.delete('/:id/items/:itemId', controller.removeItem);
  return router;
}
