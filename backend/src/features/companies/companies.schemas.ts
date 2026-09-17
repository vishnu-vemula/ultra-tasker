import { z } from 'zod';

export const listCompaniesQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25)
});

const companyBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  domain: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, 'Domain must look like example.com')
    .nullish(),
  industry: z.string().trim().max(80).nullish()
});

export const createCompanySchema = companyBodySchema;
export const updateCompanySchema = companyBodySchema.partial();

export type ListCompaniesQuery = z.infer<typeof listCompaniesQuerySchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
