import { Router } from 'express';
import type { NotificationsController } from './notifications.controller';
import type { AuthMiddleware } from '../../common/middleware/auth.middleware';

export function buildNotificationsRouter(controller: NotificationsController, auth: AuthMiddleware): Router {
  const router = Router();
  router.use(auth.requireAuth);
  router.get('/', controller.list);
  router.post('/read', controller.markRead);
  return router;
}
