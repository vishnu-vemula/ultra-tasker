import { Router } from 'express';
import type { UsersController } from './users.controller';
import type { AuthMiddleware } from '../../common/middleware/auth.middleware';

export function buildUsersRouter(controller: UsersController, auth: AuthMiddleware): Router {
  const router = Router();
  router.use(auth.requireAuth, auth.requireRole('ADMIN'));
  router.get('/', controller.list);
  router.patch('/:id/role', controller.setRole);
  return router;
}
