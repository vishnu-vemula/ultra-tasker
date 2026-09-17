import { z } from 'zod'

export const companyFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  domain: z.string().optional().or(z.literal('')),
  industry: z.string().optional().or(z.literal('')),
})

export type CompanyFormValues = z.infer<typeof companyFormSchema>
