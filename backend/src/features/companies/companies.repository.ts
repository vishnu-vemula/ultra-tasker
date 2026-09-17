import type { Company, Prisma } from '@prisma/client';
import type { PrismaService } from '../../database/prisma';

export type { Company };

const detailInclude = {
  contacts: { include: { company: true, tags: true } },
  deals: { include: { contact: true, company: true, tags: true } }
} as const;

export type CompanyDetail = Prisma.CompanyGetPayload<{ include: typeof detailInclude }>;

export interface ListCompaniesInput {
  ownerId: string;
  search?: string;
  page: number;
  pageSize: number;
}

export interface CreateCompanyInput {
  name: string;
  domain?: string | null;
  industry?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  employeeCount?: number | null;
  annualRevenue?: number | null;
  notes?: string | null;
}

export type UpdateCompanyInput = Partial<CreateCompanyInput>;

export interface ICompaniesRepository {
  list(input: ListCompaniesInput): Promise<{ items: Company[]; total: number }>;
  findByIdAndOwner(id: string, ownerId: string): Promise<{ id: string; ownerId: string } | null>;
  findDetailByIdAndOwner(id: string, ownerId: string): Promise<CompanyDetail | null>;
  companyOwnedByOwner(id: string, ownerId: string): Promise<boolean>;
  create(ownerId: string, input: CreateCompanyInput): Promise<Company>;
  update(id: string, ownerId: string, input: UpdateCompanyInput): Promise<Company>;
  delete(id: string, ownerId: string): Promise<void>;
}

export class CompaniesRepository implements ICompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(input: { ownerId: string; search?: string }): Prisma.CompanyWhereInput {
    const where: Prisma.CompanyWhereInput = { ownerId: input.ownerId };
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { domain: { contains: input.search, mode: 'insensitive' } },
        { industry: { contains: input.search, mode: 'insensitive' } }
      ];
    }
    return where;
  }

  async list(input: ListCompaniesInput): Promise<{ items: Company[]; total: number }> {
    const where = this.buildWhere(input);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize
      }),
      this.prisma.company.count({ where })
    ]);
    return { items, total };
  }

  async findByIdAndOwner(id: string, ownerId: string) {
    return this.prisma.company.findFirst({ where: { id, ownerId }, select: { id: true, ownerId: true } });
  }

  findDetailByIdAndOwner(id: string, ownerId: string) {
    return this.prisma.company.findFirst({ where: { id, ownerId }, include: detailInclude });
  }

  async companyOwnedByOwner(id: string, ownerId: string): Promise<boolean> {
    const company = await this.findByIdAndOwner(id, ownerId);
    return company !== null;
  }

  create(ownerId: string, input: CreateCompanyInput) {
    return this.prisma.company.create({
      data: {
        ownerId,
        name: input.name,
        domain: input.domain ?? null,
        industry: input.industry ?? null,
        phone: input.phone ?? null,
        city: input.city ?? null,
        country: input.country ?? null,
        employeeCount: input.employeeCount ?? null,
        annualRevenue: input.annualRevenue ?? null,
        notes: input.notes ?? null
      }
    });
  }

  update(id: string, ownerId: string, input: UpdateCompanyInput) {
    return this.prisma.company.update({
      where: { id_ownerId: { id, ownerId } },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.domain !== undefined && { domain: input.domain }),
        ...(input.industry !== undefined && { industry: input.industry }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.country !== undefined && { country: input.country }),
        ...(input.employeeCount !== undefined && { employeeCount: input.employeeCount }),
        ...(input.annualRevenue !== undefined && { annualRevenue: input.annualRevenue }),
        ...(input.notes !== undefined && { notes: input.notes })
      }
    });
  }

  async delete(id: string, ownerId: string): Promise<void> {
    await this.prisma.company.delete({ where: { id_ownerId: { id, ownerId } } });
  }
}
