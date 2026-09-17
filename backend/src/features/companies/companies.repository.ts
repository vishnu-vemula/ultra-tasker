import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../database/prisma';

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
}

export type UpdateCompanyInput = Partial<CreateCompanyInput>;

export interface ICompaniesRepository {
  list(input: ListCompaniesInput): Promise<{ items: Prisma.CompanyGetPayload<{}>[]; total: number }>;
  findByIdAndOwner(id: string, ownerId: string): Promise<{ id: string; ownerId: string } | null>;
  companyOwnedByOwner(id: string, ownerId: string): Promise<boolean>;
  create(ownerId: string, input: CreateCompanyInput): Promise<Prisma.CompanyGetPayload<{}>>;
  update(id: string, ownerId: string, input: UpdateCompanyInput): Promise<Prisma.CompanyGetPayload<{}>>;
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

  async list(input: ListCompaniesInput): Promise<{ items: Prisma.CompanyGetPayload<{}>[]; total: number }> {
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
        industry: input.industry ?? null
      }
    });
  }

  update(id: string, ownerId: string, input: UpdateCompanyInput) {
    return this.prisma.company.update({
      where: { id_ownerId: { id, ownerId } },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.domain !== undefined && { domain: input.domain }),
        ...(input.industry !== undefined && { industry: input.industry })
      }
    });
  }

  async delete(id: string, ownerId: string): Promise<void> {
    await this.prisma.company.delete({ where: { id_ownerId: { id, ownerId } } });
  }
}

export type Company = Prisma.CompanyGetPayload<{}>;
