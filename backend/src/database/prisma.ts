import { PrismaClient } from '@prisma/client';

export type PrismaService = PrismaClient;

export function createPrismaService(): PrismaService {
  return new PrismaClient();
}
