import type { AuditAction, AuditLog, EntityType, Prisma } from '@prisma/client';
import type { PrismaService } from '../../database/prisma';

export interface ListAuditInput {
  ownerId: string;
  entityType?: EntityType;
  entityId?: string;
  limit: number;
}

export interface IAuditRepository {
  create(input: { userId: string; action: AuditAction; entityType: EntityType; entityId: string; summary: string }): Promise<AuditLog>;
  list(input: ListAuditInput): Promise<AuditLog[]>;
}

export class AuditRepository implements IAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: { userId: string; action: AuditAction; entityType: EntityType; entityId: string; summary: string }): Promise<AuditLog> {
    return this.prisma.auditLog.create({ data: input });
  }

  list(input: ListAuditInput): Promise<AuditLog[]> {
    const where: Prisma.AuditLogWhereInput = { userId: input.ownerId };
    if (input.entityType) where.entityType = input.entityType;
    if (input.entityId) where.entityId = input.entityId;
    return this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: input.limit });
  }
}
