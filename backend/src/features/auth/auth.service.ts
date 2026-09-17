import type { User } from '@prisma/client';
import type { UsersService } from '../users/users.service';

export class AuthService {
  constructor(private readonly users: UsersService) {}

  session(uid: string, displayName?: string): Promise<User> {
    return this.users.session(uid, displayName);
  }
}
