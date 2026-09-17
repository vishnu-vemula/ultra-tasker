import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50)
});

export const setRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER'])
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type SetRoleInput = z.infer<typeof setRoleSchema>;
