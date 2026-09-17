import { Router } from 'express';
import type { AuditController } from './audit.controller';
import type { AuthMiddleware } from '../../common/middleware/auth.middleware';

export function buildAuditRouter(controller: AuditController, auth: AuthMiddleware): Router {
  const router = Router();
  router.use(auth.requireAuth);
  router.get('/', controller.list);
  return router;
}
