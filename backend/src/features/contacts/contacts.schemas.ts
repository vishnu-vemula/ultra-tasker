import { z } from 'zod';

export const listContactsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: z.enum(['LEAD', 'QUALIFIED', 'CUSTOMER', 'CHURNED']).optional(),
  companyId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25)
});

const contactBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().nullish(),
  phone: z.string().trim().max(40).nullish(),
  position: z.string().trim().max(80).nullish(),
  status: z.enum(['LEAD', 'QUALIFIED', 'CUSTOMER', 'CHURNED']).optional(),
  companyId: z.string().min(1).nullish(),
  notes: z.string().trim().max(2000).nullish()
});

export const createContactSchema = contactBodySchema;
export const updateContactSchema = contactBodySchema.partial();

export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
