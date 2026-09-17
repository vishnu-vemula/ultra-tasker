import type { ContactSource, ContactStatus, Prisma } from '@prisma/client';
import type { PrismaService } from '../../database/prisma';

const listInclude = { company: true, tags: true } as const;
const detailInclude = {
  company: true,
  tags: true,
  deals: { include: { contact: true, company: true, tags: true } },
  tasks: true,
  activities: { orderBy: { occurredAt: 'desc' } as const, take: 50 }
} as const;

export type ContactWithCompany = Prisma.ContactGetPayload<{ include: { company: true; tags: true } }>;
export type ContactDetail = Prisma.ContactGetPayload<{ include: typeof detailInclude }>;

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
  website?: string | null;
  city?: string | null;
  country?: string | null;
  source?: ContactSource | null;
  companyId?: string | null;
  notes?: string | null;
}

export type UpdateContactInput = Partial<CreateContactInput>;

export interface IContactsRepository {
  list(input: ListContactsInput): Promise<{ items: ContactWithCompany[]; total: number }>;
  listAll(ownerId: string): Promise<ContactWithCompany[]>;
  findByIdAndOwner(id: string, ownerId: string): Promise<ContactWithCompany | null>;
  findDetailByIdAndOwner(id: string, ownerId: string): Promise<ContactDetail | null>;
  create(ownerId: string, input: CreateContactInput): Promise<ContactWithCompany>;
  update(id: string, ownerId: string, input: UpdateContactInput): Promise<ContactWithCompany>;
  setTags(id: string, ownerId: string, tagIds: string[]): Promise<ContactWithCompany>;
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

  async list(input: ListContactsInput): Promise<{ items: ContactWithCompany[]; total: number }> {
    const where = this.buildWhere(input);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        include: listInclude,
        orderBy: [{ name: 'asc' }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize
      }),
      this.prisma.contact.count({ where })
    ]);
    return { items, total };
  }

  listAll(ownerId: string): Promise<ContactWithCompany[]> {
    return this.prisma.contact.findMany({ where: { ownerId }, include: listInclude, orderBy: { name: 'asc' } });
  }

  findByIdAndOwner(id: string, ownerId: string) {
    return this.prisma.contact.findFirst({ where: { id, ownerId }, include: listInclude });
  }

  findDetailByIdAndOwner(id: string, ownerId: string) {
    return this.prisma.contact.findFirst({ where: { id, ownerId }, include: detailInclude });
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
        website: input.website ?? null,
        city: input.city ?? null,
        country: input.country ?? null,
        source: input.source ?? null,
        companyId: input.companyId ?? null,
        notes: input.notes ?? null
      },
      include: listInclude
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
        ...(input.website !== undefined && { website: input.website }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.country !== undefined && { country: input.country }),
        ...(input.source !== undefined && { source: input.source }),
        ...(input.companyId !== undefined && { companyId: input.companyId }),
        ...(input.notes !== undefined && { notes: input.notes })
      },
      include: listInclude
    });
  }

  setTags(id: string, ownerId: string, tagIds: string[]) {
    return this.prisma.contact.update({
      where: { id_ownerId: { id, ownerId } },
      data: { tags: { set: tagIds.map((tagId) => ({ id: tagId })) } },
      include: listInclude
    });
  }

  async delete(id: string, ownerId: string): Promise<void> {
    await this.prisma.contact.delete({ where: { id_ownerId: { id, ownerId } } });
  }
}
