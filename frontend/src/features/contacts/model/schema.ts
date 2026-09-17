import { z } from 'zod'

export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  position: z.string().optional().or(z.literal('')),
  status: z.enum(['LEAD', 'QUALIFIED', 'CUSTOMER', 'CHURNED']).optional(),
  website: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  source: z
    .enum(['REFERRAL', 'WEBSITE', 'CAMPAIGN', 'COLD_OUTREACH', 'EVENT', 'OTHER'])
    .optional()
    .or(z.literal('')),
  companyId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>
