import type { Role } from '@prisma/client';

export interface AuthUser {
  uid: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
