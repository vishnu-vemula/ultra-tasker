import { z } from 'zod'

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')
    .optional()
    .or(z.literal('')),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().or(z.literal('')),
  contactId: z.string().optional().or(z.literal('')),
  dealId: z.string().optional().or(z.literal('')),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>
