import { Router } from 'express';
import type { TagsController } from './tags.controller';
import type { AuthMiddleware } from '../../common/middleware/auth.middleware';

export function buildTagsRouter(controller: TagsController, auth: AuthMiddleware): Router {
  const router = Router();
  router.use(auth.requireAuth);
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}
