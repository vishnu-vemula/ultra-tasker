import type { AuditAction, AuditLog, EntityType } from '@prisma/client';
import type { AuditLogger } from '../../common/utils/audit-logger';
import type { IAuditRepository, ListAuditInput } from './audit.repository';

export class AuditService implements AuditLogger {
  constructor(private readonly repo: IAuditRepository) {}

  async log(ownerId: string, action: AuditAction, entityType: EntityType, entityId: string, summary: string): Promise<void> {
    await this.repo.create({ userId: ownerId, action, entityType, entityId, summary });
  }

  list(ownerId: string, input: Omit<ListAuditInput, 'ownerId'>): Promise<AuditLog[]> {
    return this.repo.list({ ...input, ownerId });
  }
}
