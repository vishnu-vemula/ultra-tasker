import { z } from 'zod'

export const productFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional().or(z.literal('')),
  price: z.coerce.number().min(0, 'Price must be zero or more'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR']),
  active: z.boolean(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>
