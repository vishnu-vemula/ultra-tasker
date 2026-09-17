import { z } from 'zod';

export const listTasksQuerySchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  contactId: z.string().min(1).optional(),
  dealId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50)
});

const taskBodySchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullish(),
  dueDate: z.coerce.date().nullish(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).nullish(),
  contactId: z.string().min(1).nullish(),
  dealId: z.string().min(1).nullish()
});

export const createTaskSchema = taskBodySchema;
export const updateTaskSchema = taskBodySchema.partial();

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
