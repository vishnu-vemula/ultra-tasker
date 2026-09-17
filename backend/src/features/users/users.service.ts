import type { Role, User } from '@prisma/client';
import type { AuthUser } from '../../types/express';
import { AppError } from '../../common/utils/app-error';
import { firebaseAuth } from '../../database/firebase';
import { bootstrapAdminEmails } from '../../config/env';
import type { IUsersRepository, ListUsersInput, UpsertFromFirebaseInput } from './users.repository';

const USER_CACHE_TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
  user: User;
  syncedAt: number;
}

export class UsersService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly repo: IUsersRepository) {}

  async ensureFromToken(decoded: { uid: string; email?: string; name?: string; picture?: string }): Promise<User> {
    const cached = this.cache.get(decoded.uid);
    if (cached && Date.now() - cached.syncedAt < USER_CACHE_TTL_MS) {
      return cached.user;
    }
    if (!decoded.email) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Token has no email claim');
    }
    const input: UpsertFromFirebaseInput = {
      id: decoded.uid,
      email: decoded.email.toLowerCase(),
      displayName: decoded.name ?? null,
      photoURL: decoded.picture ?? null,
      forceAdmin: bootstrapAdminEmails.includes(decoded.email.toLowerCase())
    };
    const user = await this.repo.upsertFromFirebase(input);
    this.cache.set(decoded.uid, { user, syncedAt: Date.now() });
    return user;
  }

  toAuthUser(user: User): AuthUser {
    return { uid: user.id, email: user.email, role: user.role };
  }

  async session(uid: string, displayName?: string): Promise<User> {
    this.cache.delete(uid);
    if (displayName !== undefined && displayName.length > 0) {
      return this.repo.updateProfile(uid, { displayName });
    }
    const user = await this.repo.findById(uid);
    if (!user) throw AppError.notFound('User');
    return user;
  }

  list(uid: string, input: ListUsersInput): Promise<{ items: User[]; total: number }> {
    void uid;
    return this.repo.list(input);
  }

  async setRole(requesterUid: string, targetId: string, role: Role): Promise<User> {
    if (requesterUid === targetId && role !== 'ADMIN') {
      throw new AppError(422, 'INVALID_INPUT', 'Admins cannot demote themselves');
    }
    const user = await this.repo.setRole(targetId, role);
    await firebaseAuth.setCustomUserClaims(targetId, { role });
    this.cache.delete(targetId);
    return user;
  }
}
