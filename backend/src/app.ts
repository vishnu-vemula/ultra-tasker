import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { corsOrigins, env } from './config/env';
import { errorHandler } from './common/middleware/error.middleware';
import { createContainer } from './container';

export function createApp(): express.Express {
  const app = express();
  const container = createContainer();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Origin not allowed by CORS'));
        }
      }
    })
  );
  app.use(compression());
  app.use(
    pinoHttp({
      level: env.NODE_ENV === 'test' ? 'silent' : 'info',
      redact: { paths: ['req.headers.authorization', 'res.headers["set-cookie"]'], remove: true }
    })
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: 'draft-7',
      legacyHeaders: false
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ data: { status: 'ok', env: env.NODE_ENV } });
  });

  app.use('/api/v1/auth', container.routers.auth);
  app.use('/api/v1/users', container.routers.users);
  app.use('/api/v1/contacts', container.routers.contacts);
  app.use('/api/v1/companies', container.routers.companies);
  app.use('/api/v1/deals', container.routers.deals);
  app.use('/api/v1/tasks', container.routers.tasks);
  app.use('/api/v1/tags', container.routers.tags);
  app.use('/api/v1/products', container.routers.products);
  app.use('/api/v1/activities', container.routers.activities);
  app.use('/api/v1/notifications', container.routers.notifications);
  app.use('/api/v1/audit', container.routers.audit);
  app.use('/api/v1/search', container.routers.search);
  app.use('/api/v1/dashboard', container.routers.dashboard);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  app.use(errorHandler);

  return app;
}
