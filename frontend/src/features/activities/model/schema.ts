import { z } from 'zod'

export const activityFormSchema = z.object({
  type: z.enum(['NOTE', 'CALL', 'EMAIL', 'MEETING']),
  title: z.string().min(1, 'Title is required'),
  occurredAt: z.string().min(1, 'Occurred at is required'),
  durationMin: z
    .string()
    .refine((value) => value === '' || /^\d+$/.test(value), 'Enter a whole number of minutes'),
  body: z.string().optional().or(z.literal('')),
  contactId: z.string().optional().or(z.literal('')),
  dealId: z.string().optional().or(z.literal('')),
})

export type ActivityFormValues = z.infer<typeof activityFormSchema>
