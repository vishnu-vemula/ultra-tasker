import { Router } from 'express';
import type { TasksController } from './tasks.controller';
import type { AuthMiddleware } from '../../common/middleware/auth.middleware';

export function buildTasksRouter(controller: TasksController, auth: AuthMiddleware): Router {
  const router = Router();
  router.use(auth.requireAuth);
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.get);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}
