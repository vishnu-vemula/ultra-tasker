import type { DealStage, Prisma } from '@prisma/client';
import type { PrismaService } from '../../database/prisma';

const dealInclude = { contact: true, company: true } as const;

export type DealWithRelations = Prisma.DealGetPayload<{ include: typeof dealInclude }>;

export interface ListDealsInput {
  ownerId: string;
  stage?: DealStage;
  contactId?: string;
  companyId?: string;
  search?: string;
  sort: 'position' | 'recent';
  page: number;
  pageSize: number;
}

export interface CreateDealInput {
  title: string;
  value: number;
  stage?: Prisma.DealCreateInput['stage'];
  currency?: string;
  contactId?: string | null;
  companyId?: string | null;
  expectedCloseDate?: Date | null;
  notes?: string | null;
  position?: number;
}

export type UpdateDealInput = Partial<CreateDealInput>;

export interface ReorderUpdateInput {
  id: string;
  stage: Prisma.DealCreateInput['stage'];
  position: number;
}

export interface IDealsRepository {
  list(input: ListDealsInput): Promise<{ items: DealWithRelations[]; total: number }>;
  findByIdAndOwner(id: string, ownerId: string): Promise<DealWithRelations | null>;
  maxPositionInStage(ownerId: string, stage: string): Promise<number>;
  relationOwnedByOwner(kind: 'contact' | 'company', id: string, ownerId: string): Promise<boolean>;
  create(ownerId: string, input: CreateDealInput): Promise<DealWithRelations>;
  update(id: string, ownerId: string, input: UpdateDealInput): Promise<DealWithRelations>;
  delete(id: string, ownerId: string): Promise<void>;
  reorder(ownerId: string, updates: ReorderUpdateInput[]): Promise<DealWithRelations[]>;
}

export class DealsRepository implements IDealsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(input: ListDealsInput): Prisma.DealWhereInput {
    const where: Prisma.DealWhereInput = { ownerId: input.ownerId };
    if (input.stage) where.stage = input.stage;
    if (input.contactId) where.contactId = input.contactId;
    if (input.companyId) where.companyId = input.companyId;
    if (input.search) {
      where.OR = [
        { title: { contains: input.search, mode: 'insensitive' } },
        { contact: { name: { contains: input.search, mode: 'insensitive' } } },
        { company: { name: { contains: input.search, mode: 'insensitive' } } }
      ];
    }
    return where;
  }

  async list(input: ListDealsInput): Promise<{ items: DealWithRelations[]; total: number }> {
    const where = this.buildWhere(input);
    const orderBy: Prisma.DealOrderByWithRelationInput[] =
      input.sort === 'recent' ? [{ createdAt: 'desc' }] : [{ position: 'asc' }, { createdAt: 'desc' }];
    const [items, total] = await this.prisma.$transaction([
      this.prisma.deal.findMany({
        where,
        include: dealInclude,
        orderBy,
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize
      }),
      this.prisma.deal.count({ where })
    ]);
    return { items, total };
  }

  findByIdAndOwner(id: string, ownerId: string): Promise<DealWithRelations | null> {
    return this.prisma.deal.findFirst({ where: { id, ownerId }, include: dealInclude });
  }

  async maxPositionInStage(ownerId: string, stage: string): Promise<number> {
    const agg = await this.prisma.deal.aggregate({
      _max: { position: true },
      where: { ownerId, stage: stage as DealStage }
    });
    return agg._max.position ?? 0;
  }

  relationOwnedByOwner(kind: 'contact' | 'company', id: string, ownerId: string): Promise<boolean> {
    if (kind === 'contact') {
      return this.prisma.contact
        .findFirst({ where: { id, ownerId }, select: { id: true } })
        .then((row) => row !== null);
    }
    return this.prisma.company
      .findFirst({ where: { id, ownerId }, select: { id: true } })
      .then((row) => row !== null);
  }

  create(ownerId: string, input: CreateDealInput): Promise<DealWithRelations> {
    return this.prisma.deal.create({
      data: {
        ownerId,
        title: input.title,
        value: input.value,
        currency: input.currency ?? 'USD',
        stage: input.stage ?? 'NEW',
        position: input.position ?? 1,
        contactId: input.contactId ?? null,
        companyId: input.companyId ?? null,
        expectedCloseDate: input.expectedCloseDate ?? null,
        notes: input.notes ?? null,
        closedAt: input.stage === 'WON' || input.stage === 'LOST' ? new Date() : null
      },
      include: dealInclude
    });
  }

  update(id: string, ownerId: string, input: UpdateDealInput): Promise<DealWithRelations> {
    return this.prisma.deal.update({
      where: { id_ownerId: { id, ownerId } },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.value !== undefined && { value: input.value }),
        ...(input.currency !== undefined && { currency: input.currency }),
        ...(input.stage !== undefined && { stage: input.stage }),
        ...(input.contactId !== undefined && { contactId: input.contactId }),
        ...(input.companyId !== undefined && { companyId: input.companyId }),
        ...(input.expectedCloseDate !== undefined && { expectedCloseDate: input.expectedCloseDate }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.stage === 'WON' || input.stage === 'LOST' ? { closedAt: new Date() } : {}),
        ...(input.stage === 'NEW' || input.stage === 'QUALIFIED' || input.stage === 'PROPOSAL' || input.stage === 'NEGOTIATION'
          ? { closedAt: null }
          : {})
      },
      include: dealInclude
    });
  }

  async delete(id: string, ownerId: string): Promise<void> {
    await this.prisma.deal.delete({ where: { id_ownerId: { id, ownerId } } });
  }

  async reorder(ownerId: string, updates: ReorderUpdateInput[]): Promise<DealWithRelations[]> {
    await this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.deal.updateMany({
          where: { id: update.id, ownerId },
          data: { stage: update.stage, position: update.position }
        })
      )
    );
    return this.prisma.deal.findMany({
      where: { ownerId, id: { in: updates.map((update) => update.id) } },
      include: dealInclude
    });
  }
}
