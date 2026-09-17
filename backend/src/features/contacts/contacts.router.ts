import { Router } from 'express';
import type { ContactsController } from './contacts.controller';
import type { AuthMiddleware } from '../../common/middleware/auth.middleware';

export function buildContactsRouter(controller: ContactsController, auth: AuthMiddleware): Router {
  const router = Router();
  router.use(auth.requireAuth);
  router.get('/export', controller.exportCsv);
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.get);
  router.patch('/:id', controller.update);
  router.patch('/:id/tags', controller.setTags);
  router.delete('/:id', controller.remove);
  return router;
}
