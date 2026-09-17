import { z } from 'zod'

export const tagFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex color like #6366f1'),
})

export type TagFormValues = z.infer<typeof tagFormSchema>
