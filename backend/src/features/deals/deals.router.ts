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
  router.delete('/:id', controller.remove);
  return router;
}
