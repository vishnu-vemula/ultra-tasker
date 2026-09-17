import type { NextFunction, Request, Response } from 'express';
import type { AuthUser } from '../../types/express';
import { AppError } from './app-error';

type Handler = (req: Request, res: Response, next: NextFunction) => unknown;

export const asyncHandler =
  (handler: Handler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

export function requireUser(req: Request): AuthUser {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  }
  return req.user;
}
