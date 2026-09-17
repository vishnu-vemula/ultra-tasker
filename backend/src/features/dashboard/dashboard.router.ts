import { Router } from 'express';
import type { DashboardController } from './dashboard.controller';
import type { AuthMiddleware } from '../../common/middleware/auth.middleware';

export function buildDashboardRouter(controller: DashboardController, auth: AuthMiddleware): Router {
  const router = Router();
  router.use(auth.requireAuth);
  router.get('/stats', controller.stats);
  return router;
}
