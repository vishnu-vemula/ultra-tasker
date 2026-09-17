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
  industry: z.string().trim().max(80).nullish(),
  phone: z.string().trim().max(40).nullish(),
  city: z.string().trim().max(80).nullish(),
  country: z.string().trim().max(80).nullish(),
  employeeCount: z.coerce.number().int().min(0).max(10_000_000).nullish(),
  annualRevenue: z.coerce.number().min(0).max(1_000_000_000_000).nullish(),
  notes: z.string().trim().max(2000).nullish()
});

export const createCompanySchema = companyBodySchema;
export const updateCompanySchema = companyBodySchema.partial();

export type ListCompaniesQuery = z.infer<typeof listCompaniesQuerySchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
