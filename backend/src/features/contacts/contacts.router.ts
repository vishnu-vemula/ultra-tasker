import { Router } from 'express';
import type { ContactsController } from './contacts.controller';
import type { AuthMiddleware } from '../../common/middleware/auth.middleware';

export function buildContactsRouter(controller: ContactsController, auth: AuthMiddleware): Router {
  const router = Router();
  router.use(auth.requireAuth);
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.get);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}
