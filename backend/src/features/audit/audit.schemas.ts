import { z } from 'zod';

export const listAuditQuerySchema = z.object({
  entityType: z.enum(['CONTACT', 'COMPANY', 'DEAL', 'TASK', 'ACTIVITY', 'TAG', 'PRODUCT']).optional(),
  entityId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

export type ListAuditQuery = z.infer<typeof listAuditQuerySchema>;
