import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../database/prisma';

const activityInclude = {
  contact: { select: { id: true, name: true } },
  deal: { select: { id: true, title: true } }
} as const;

export type ActivityWithRelations = Prisma.ActivityGetPayload<{ include: typeof activityInclude }>;

export interface ListActivitiesInput {
  ownerId: string;
  contactId?: string;
  dealId?: string;
  companyId?: string;
  page: number;
  pageSize: number;
}

export interface CreateActivityData {
  type: Prisma.ActivityCreateInput['type'];
  title: string;
  body?: string | null;
  occurredAt?: Date;
  durationMin?: number | null;
  contactId?: string | null;
  dealId?: string | null;
  companyId?: string | null;
}

export type UpdateActivityData = Partial<CreateActivityData>;

export interface IActivitiesRepository {
  list(input: ListActivitiesInput): Promise<{ items: ActivityWithRelations[]; total: number }>;
  findByIdAndOwner(id: string, ownerId: string): Promise<ActivityWithRelations | null>;
  relationOwnedByOwner(kind: 'contact' | 'deal' | 'company', id: string, ownerId: string): Promise<boolean>;
  touchContactLastActivity(contactId: string, ownerId: string, date: Date): Promise<void>;
  create(ownerId: string, input: CreateActivityData): Promise<ActivityWithRelations>;
  update(id: string, ownerId: string, input: UpdateActivityData): Promise<ActivityWithRelations>;
  delete(id: string, ownerId: string): Promise<void>;
}

export class ActivitiesRepository implements IActivitiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(input: ListActivitiesInput): Promise<{ items: ActivityWithRelations[]; total: number }> {
    const where: Prisma.ActivityWhereInput = { ownerId: input.ownerId };
    if (input.contactId) where.contactId = input.contactId;
    if (input.dealId) where.dealId = input.dealId;
    if (input.companyId) where.companyId = input.companyId;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.activity.findMany({
        where,
        include: activityInclude,
        orderBy: { occurredAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize
      }),
      this.prisma.activity.count({ where })
    ]);
    return { items, total };
  }

  findByIdAndOwner(id: string, ownerId: string): Promise<ActivityWithRelations | null> {
    return this.prisma.activity.findFirst({ where: { id, ownerId }, include: activityInclude });
  }

  relationOwnedByOwner(kind: 'contact' | 'deal' | 'company', id: string, ownerId: string): Promise<boolean> {
    if (kind === 'contact') {
      return this.prisma.contact.findFirst({ where: { id, ownerId }, select: { id: true } }).then((row) => row !== null);
    }
    if (kind === 'deal') {
      return this.prisma.deal.findFirst({ where: { id, ownerId }, select: { id: true } }).then((row) => row !== null);
    }
    return this.prisma.company.findFirst({ where: { id, ownerId }, select: { id: true } }).then((row) => row !== null);
  }

  async touchContactLastActivity(contactId: string, ownerId: string, date: Date): Promise<void> {
    await this.prisma.contact.updateMany({ where: { id: contactId, ownerId }, data: { lastActivityAt: date } });
  }

  create(ownerId: string, input: CreateActivityData): Promise<ActivityWithRelations> {
    return this.prisma.activity.create({
      data: {
        ownerId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        occurredAt: input.occurredAt ?? new Date(),
        durationMin: input.durationMin ?? null,
        contactId: input.contactId ?? null,
        dealId: input.dealId ?? null,
        companyId: input.companyId ?? null
      },
      include: activityInclude
    });
  }

  update(id: string, ownerId: string, input: UpdateActivityData): Promise<ActivityWithRelations> {
    return this.prisma.activity.update({
      where: { id_ownerId: { id, ownerId } },
      data: {
        ...(input.type !== undefined && { type: input.type }),
        ...(input.title !== undefined && { title: input.title }),
        ...(input.body !== undefined && { body: input.body }),
        ...(input.occurredAt !== undefined && { occurredAt: input.occurredAt }),
        ...(input.durationMin !== undefined && { durationMin: input.durationMin }),
        ...(input.contactId !== undefined && { contactId: input.contactId }),
        ...(input.dealId !== undefined && { dealId: input.dealId }),
        ...(input.companyId !== undefined && { companyId: input.companyId })
      },
      include: activityInclude
    });
  }

  async delete(id: string, ownerId: string): Promise<void> {
    await this.prisma.activity.delete({ where: { id_ownerId: { id, ownerId } } });
  }
}
