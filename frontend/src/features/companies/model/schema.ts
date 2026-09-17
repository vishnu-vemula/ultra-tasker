import { z } from 'zod'

export const companyFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  domain: z.string().optional().or(z.literal('')),
  industry: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  employeeCount: z
    .string()
    .refine((value) => value === '' || /^\d+$/.test(value), 'Enter a whole number'),
  annualRevenue: z
    .string()
    .refine((value) => value === '' || /^\d+(\.\d+)?$/.test(value), 'Enter a valid amount'),
  notes: z.string().optional().or(z.literal('')),
})

export type CompanyFormValues = z.infer<typeof companyFormSchema>
