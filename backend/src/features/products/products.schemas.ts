import { z } from 'zod';

export const listProductsQuerySchema = z.object({
  search: z.string().trim().min(1).optional()
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sku: z.string().trim().min(1).max(40).nullish(),
  price: z.coerce.number().min(0).max(1_000_000_000),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR']).optional(),
  active: z.coerce.boolean().optional()
});

export const updateProductSchema = createProductSchema.partial();

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
