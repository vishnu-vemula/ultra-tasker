import 'dotenv/config';
import { createApp } from './app';
import { env } from './config/env';

const app = createApp();
const server = app.listen(env.PORT, () => {
  console.log(`Ultra Tasker API listening on port ${env.PORT} (${env.NODE_ENV})`);
});

const shutdown = (signal: string): void => {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
