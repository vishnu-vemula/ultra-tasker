import type { Prisma, Role, User } from '@prisma/client';
import type { PrismaService } from '../../database/prisma';

export interface UpsertFromFirebaseInput {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  forceAdmin?: boolean;
}

export interface ListUsersInput {
  search?: string;
  page: number;
  pageSize: number;
}

export interface IUsersRepository {
  upsertFromFirebase(input: UpsertFromFirebaseInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  list(input: ListUsersInput): Promise<{ items: User[]; total: number }>;
  setRole(id: string, role: Role): Promise<User>;
  updateProfile(id: string, data: { displayName?: string | null; photoURL?: string | null }): Promise<User>;
}

export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertFromFirebase(input: UpsertFromFirebaseInput): Promise<User> {
    const profile = { displayName: input.displayName, photoURL: input.photoURL };
    return this.prisma.user.upsert({
      where: { id: input.id },
      create: { id: input.id, email: input.email, role: input.forceAdmin ? 'ADMIN' : 'MEMBER', ...profile },
      update: input.forceAdmin ? { ...profile, role: 'ADMIN' } : profile
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async list(input: ListUsersInput): Promise<{ items: User[]; total: number }> {
    const where: Prisma.UserWhereInput = input.search
      ? {
          OR: [
            { email: { contains: input.search, mode: 'insensitive' } },
            { displayName: { contains: input.search, mode: 'insensitive' } }
          ]
        }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize
      }),
      this.prisma.user.count({ where })
    ]);
    return { items, total };
  }

  setRole(id: string, role: Role): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  updateProfile(id: string, data: { displayName?: string | null; photoURL?: string | null }): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }
}
