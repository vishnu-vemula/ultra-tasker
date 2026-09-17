import { Router } from 'express';
import type { AuthController } from './auth.controller';
import type { AuthMiddleware } from '../../common/middleware/auth.middleware';

export function buildAuthRouter(controller: AuthController, auth: AuthMiddleware): Router {
  const router = Router();
  router.use(auth.requireAuth);
  router.post('/session', controller.session);
  return router;
}
