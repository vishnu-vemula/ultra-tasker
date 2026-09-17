import { Router } from 'express';
import type { SearchController } from './search.controller';
import type { AuthMiddleware } from '../../common/middleware/auth.middleware';

export function buildSearchRouter(controller: SearchController, auth: AuthMiddleware): Router {
  const router = Router();
  router.use(auth.requireAuth);
  router.get('/', controller.query);
  return router;
}
