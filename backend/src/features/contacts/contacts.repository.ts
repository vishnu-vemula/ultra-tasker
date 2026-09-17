import type { ContactStatus, Prisma } from '@prisma/client';
import type { PrismaService } from '../../database/prisma';

export interface ContactWhereInput {
  ownerId: string;
  search?: string;
  status?: ContactStatus;
  companyId?: string;
}

export interface ListContactsInput extends ContactWhereInput {
  page: number;
  pageSize: number;
}

export interface CreateContactInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  status?: Prisma.ContactCreateInput['status'];
  companyId?: string | null;
  notes?: string | null;
}

export type UpdateContactInput = Partial<CreateContactInput>;

export interface IContactsRepository {
  list(input: ListContactsInput): Promise<{ items: Prisma.ContactGetPayload<{ include: { company: true } }>[]; total: number }>;
  findByIdAndOwner(id: string, ownerId: string): Promise<Prisma.ContactGetPayload<{ include: { company: true } }> | null>;
  create(ownerId: string, input: CreateContactInput): Promise<Prisma.ContactGetPayload<{ include: { company: true } }>>;
  update(id: string, ownerId: string, input: UpdateContactInput): Promise<Prisma.ContactGetPayload<{ include: { company: true } }>>;
  delete(id: string, ownerId: string): Promise<void>;
}

export class ContactsRepository implements IContactsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(input: ContactWhereInput): Prisma.ContactWhereInput {
    const where: Prisma.ContactWhereInput = { ownerId: input.ownerId };
    if (input.status) where.status = input.status;
    if (input.companyId) where.companyId = input.companyId;
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { email: { contains: input.search, mode: 'insensitive' } },
        { phone: { contains: input.search } },
        { company: { name: { contains: input.search, mode: 'insensitive' } } }
      ];
    }
    return where;
  }

  async list(input: ListContactsInput): Promise<Awaited<ReturnType<IContactsRepository['list']>>> {
    const where = this.buildWhere(input);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        include: { company: true },
        orderBy: [{ name: 'asc' }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize
      }),
      this.prisma.contact.count({ where })
    ]);
    return { items, total };
  }

  findByIdAndOwner(id: string, ownerId: string) {
    return this.prisma.contact.findFirst({ where: { id, ownerId }, include: { company: true } });
  }

  create(ownerId: string, input: CreateContactInput) {
    return this.prisma.contact.create({
      data: {
        ownerId,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        position: input.position ?? null,
        status: input.status ?? 'LEAD',
        companyId: input.companyId ?? null,
        notes: input.notes ?? null
      },
      include: { company: true }
    });
  }

  update(id: string, ownerId: string, input: UpdateContactInput) {
    return this.prisma.contact.update({
      where: { id_ownerId: { id, ownerId } },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.position !== undefined && { position: input.position }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.companyId !== undefined && { companyId: input.companyId }),
        ...(input.notes !== undefined && { notes: input.notes })
      },
      include: { company: true }
    });
  }

  async delete(id: string, ownerId: string): Promise<void> {
    await this.prisma.contact.delete({ where: { id_ownerId: { id, ownerId } } });
  }
}

export type ContactWithCompany = Prisma.ContactGetPayload<{ include: { company: true } }>;
