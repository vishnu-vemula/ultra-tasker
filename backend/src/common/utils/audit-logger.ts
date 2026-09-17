import type { AuditAction, EntityType } from '@prisma/client';

export interface AuditLogger {
  log(ownerId: string, action: AuditAction, entityType: EntityType, entityId: string, summary: string): Promise<void>;
}
