import { z } from 'zod';

export const listActivitiesQuerySchema = z.object({
  contactId: z.string().min(1).optional(),
  dealId: z.string().min(1).optional(),
  companyId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50)
});

export const createActivitySchema = z.object({
  type: z.enum(['NOTE', 'CALL', 'EMAIL', 'MEETING']),
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().max(4000).nullish(),
  occurredAt: z.coerce.date().optional(),
  durationMin: z.coerce.number().int().min(1).max(1440).nullish(),
  contactId: z.string().min(1).nullish(),
  dealId: z.string().min(1).nullish(),
  companyId: z.string().min(1).nullish()
});

export const updateActivitySchema = createActivitySchema.partial();

export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
