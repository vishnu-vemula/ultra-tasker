import type { DealStage, Prisma } from '@prisma/client';
import type { PrismaService } from '../../database/prisma';

const dealInclude = { contact: true, company: true, tags: true } as const;
const detailInclude = {
  contact: true,
  company: true,
  tags: true,
  items: { include: { product: true } },
  activities: { orderBy: { occurredAt: 'desc' } as const, take: 50 }
} as const;

export type DealWithRelations = Prisma.DealGetPayload<{ include: typeof dealInclude }>;
export type DealDetail = Prisma.DealGetPayload<{ include: typeof detailInclude }>;
export type DealItemWithProduct = Prisma.DealItemGetPayload<{ include: { product: true } }>;

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
  probability?: number;
  source?: Prisma.DealCreateInput['source'];
  nextStep?: string | null;
  lostReason?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  expectedCloseDate?: Date | null;
  notes?: string | null;
  position?: number;
}

export type UpdateDealInput = Partial<CreateDealInput>;

export interface CreateDealItemData {
  productId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
}

export type UpdateDealItemData = Partial<CreateDealItemData>;

export interface ReorderUpdateInput {
  id: string;
  stage: DealStage;
  position: number;
}

export interface IDealsRepository {
  list(input: ListDealsInput): Promise<{ items: DealWithRelations[]; total: number }>;
  findByIdAndOwner(id: string, ownerId: string): Promise<DealWithRelations | null>;
  findDetailByIdAndOwner(id: string, ownerId: string): Promise<DealDetail | null>;
  maxPositionInStage(ownerId: string, stage: string): Promise<number>;
  relationOwnedByOwner(kind: 'contact' | 'company', id: string, ownerId: string): Promise<boolean>;
  create(ownerId: string, input: CreateDealInput): Promise<DealWithRelations>;
  update(id: string, ownerId: string, input: UpdateDealInput): Promise<DealWithRelations>;
  delete(id: string, ownerId: string): Promise<void>;
  reorder(ownerId: string, updates: ReorderUpdateInput[]): Promise<DealWithRelations[]>;
  setTags(id: string, ownerId: string, tagIds: string[]): Promise<DealWithRelations>;
  addItem(ownerId: string, dealId: string, input: CreateDealItemData): Promise<DealItemWithProduct>;
  findItemByIdAndOwner(id: string, ownerId: string): Promise<DealItemWithProduct | null>;
  updateItem(id: string, ownerId: string, input: UpdateDealItemData): Promise<DealItemWithProduct>;
  deleteItem(id: string, ownerId: string): Promise<void>;
  sumItemTotals(dealId: string): Promise<number>;
  setValue(id: string, ownerId: string, value: number): Promise<void>;
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

  findDetailByIdAndOwner(id: string, ownerId: string): Promise<DealDetail | null> {
    return this.prisma.deal.findFirst({ where: { id, ownerId }, include: detailInclude });
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
      return this.prisma.contact.findFirst({ where: { id, ownerId }, select: { id: true } }).then((row) => row !== null);
    }
    return this.prisma.company.findFirst({ where: { id, ownerId }, select: { id: true } }).then((row) => row !== null);
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
        probability: input.probability ?? 10,
        source: input.source ?? null,
        nextStep: input.nextStep ?? null,
        lostReason: input.lostReason ?? null,
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
    const isOpenStage =
      input.stage === 'NEW' || input.stage === 'QUALIFIED' || input.stage === 'PROPOSAL' || input.stage === 'NEGOTIATION';
    return this.prisma.deal.update({
      where: { id_ownerId: { id, ownerId } },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.value !== undefined && { value: input.value }),
        ...(input.currency !== undefined && { currency: input.currency }),
        ...(input.stage !== undefined && { stage: input.stage }),
        ...(input.probability !== undefined && { probability: input.probability }),
        ...(input.source !== undefined && { source: input.source }),
        ...(input.nextStep !== undefined && { nextStep: input.nextStep }),
        ...(input.lostReason !== undefined && { lostReason: input.lostReason }),
        ...(input.contactId !== undefined && { contactId: input.contactId }),
        ...(input.companyId !== undefined && { companyId: input.companyId }),
        ...(input.expectedCloseDate !== undefined && { expectedCloseDate: input.expectedCloseDate }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.stage === 'WON' || input.stage === 'LOST' ? { closedAt: new Date() } : {}),
        ...(input.stage !== undefined && isOpenStage ? { closedAt: null } : {})
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

  setTags(id: string, ownerId: string, tagIds: string[]): Promise<DealWithRelations> {
    return this.prisma.deal.update({
      where: { id_ownerId: { id, ownerId } },
      data: { tags: { set: tagIds.map((tagId) => ({ id: tagId })) } },
      include: dealInclude
    });
  }

  addItem(ownerId: string, dealId: string, input: CreateDealItemData): Promise<DealItemWithProduct> {
    return this.prisma.dealItem.create({
      data: {
        ownerId,
        dealId,
        productId: input.productId ?? null,
        description: input.description,
        quantity: input.quantity,
        unitPrice: input.unitPrice
      },
      include: { product: true }
    });
  }

  findItemByIdAndOwner(id: string, ownerId: string): Promise<DealItemWithProduct | null> {
    return this.prisma.dealItem.findFirst({ where: { id, ownerId }, include: { product: true } });
  }

  updateItem(id: string, ownerId: string, input: UpdateDealItemData): Promise<DealItemWithProduct> {
    return this.prisma.dealItem.update({
      where: { id_ownerId: { id, ownerId } },
      data: {
        ...(input.productId !== undefined && { productId: input.productId }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.quantity !== undefined && { quantity: input.quantity }),
        ...(input.unitPrice !== undefined && { unitPrice: input.unitPrice })
      },
      include: { product: true }
    });
  }

  async deleteItem(id: string, ownerId: string): Promise<void> {
    await this.prisma.dealItem.delete({ where: { id_ownerId: { id, ownerId } } });
  }

  async sumItemTotals(dealId: string): Promise<number> {
    const items = await this.prisma.dealItem.findMany({ where: { dealId }, select: { quantity: true, unitPrice: true } });
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  async setValue(id: string, ownerId: string, value: number): Promise<void> {
    await this.prisma.deal.update({ where: { id_ownerId: { id, ownerId } }, data: { value } });
  }
}
