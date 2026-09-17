import type { DealStage } from '@prisma/client';
import { AppError } from '../../common/utils/app-error';
import type { AuditLogger } from '../../common/utils/audit-logger';
import type { NotificationDispatcher } from '../../common/utils/notification-dispatcher';
import type { TagsOwnershipChecker } from '../contacts/contacts.service';
import type {
  DealDetail,
  DealItemWithProduct,
  DealWithRelations,
  IDealsRepository
} from './deals.repository';
import type {
  CreateDealInput,
  CreateDealItemInput,
  ListDealsQuery,
  ReorderDealsInput,
  SetDealTagsInput,
  UpdateDealInput,
  UpdateDealItemInput
} from './deals.schemas';

const DEFAULT_PROBABILITY: Record<DealStage, number> = {
  NEW: 10,
  QUALIFIED: 25,
  PROPOSAL: 50,
  NEGOTIATION: 75,
  WON: 100,
  LOST: 0
};

export class DealsService {
  constructor(
    private readonly repo: IDealsRepository,
    private readonly audit: AuditLogger,
    private readonly notifications: NotificationDispatcher,
    private readonly tags: TagsOwnershipChecker
  ) {}

  list(ownerId: string, query: ListDealsQuery): Promise<{ items: DealWithRelations[]; total: number }> {
    return this.repo.list({
      ownerId,
      stage: query.stage,
      contactId: query.contactId,
      companyId: query.companyId,
      search: query.search,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize
    });
  }

  async get(ownerId: string, id: string): Promise<DealWithRelations> {
    const deal = await this.repo.findByIdAndOwner(id, ownerId);
    if (!deal) throw AppError.notFound('Deal');
    return deal;
  }

  async getDetail(ownerId: string, id: string): Promise<DealDetail> {
    const deal = await this.repo.findDetailByIdAndOwner(id, ownerId);
    if (!deal) throw AppError.notFound('Deal');
    return deal;
  }

  async create(ownerId: string, input: CreateDealInput): Promise<DealWithRelations> {
    await this.assertRelationsOwned(ownerId, input.contactId ?? null, input.companyId ?? null);
    const stage = input.stage ?? 'NEW';
    const maxPosition = await this.repo.maxPositionInStage(ownerId, stage);
    const deal = await this.repo.create(ownerId, {
      ...input,
      stage,
      probability: input.probability ?? DEFAULT_PROBABILITY[stage],
      position: maxPosition + 1
    });
    await this.audit.log(ownerId, 'CREATE', 'DEAL', deal.id, `Created deal "${deal.title}" (${deal.value} ${deal.currency})`);
    return deal;
  }

  async update(ownerId: string, id: string, input: UpdateDealInput): Promise<DealWithRelations> {
    const existing = await this.get(ownerId, id);
    if (input.contactId !== undefined || input.companyId !== undefined) {
      await this.assertRelationsOwned(ownerId, input.contactId ?? null, input.companyId ?? null);
    }
    const nextStage = input.stage;
    const stageChanged = nextStage !== undefined && nextStage !== existing.stage;
    const patch = { ...input };
    if (stageChanged && nextStage !== undefined && input.probability === undefined) {
      patch.probability = DEFAULT_PROBABILITY[nextStage];
    }
    if (stageChanged && (nextStage === 'WON' || nextStage === 'LOST')) {
      patch.lostReason = input.lostReason ?? existing.lostReason;
    }
    const updated = await this.repo.update(id, ownerId, patch);
    await this.audit.log(ownerId, 'UPDATE', 'DEAL', id, `Updated deal "${updated.title}"`);
    if (stageChanged && nextStage !== undefined) {
      await this.audit.log(ownerId, 'STAGE_CHANGE', 'DEAL', id, `${existing.stage} → ${nextStage}`);
      if (nextStage === 'WON') {
        await this.notifications.dispatch(ownerId, {
          type: 'DEAL_WON',
          title: `Deal won: ${updated.title}`,
          body: `${updated.value} ${updated.currency}`,
          dedupeKey: `deal-won:${id}`
        });
      }
    }
    return updated;
  }

  async delete(ownerId: string, id: string): Promise<void> {
    const deal = await this.get(ownerId, id);
    await this.repo.delete(id, ownerId);
    await this.audit.log(ownerId, 'DELETE', 'DEAL', id, `Deleted deal "${deal.title}"`);
  }

  async setTags(ownerId: string, id: string, input: SetDealTagsInput): Promise<DealWithRelations> {
    await this.get(ownerId, id);
    await this.tags.assertAllOwned(input.tagIds, ownerId);
    const deal = await this.repo.setTags(id, ownerId, input.tagIds);
    await this.audit.log(ownerId, 'UPDATE', 'DEAL', id, `Set ${input.tagIds.length} tags on "${deal.title}"`);
    return deal;
  }

  async reorder(ownerId: string, input: ReorderDealsInput): Promise<DealWithRelations[]> {
    const ids = input.updates.map((update) => update.id);
    const owned = await Promise.all(ids.map((id) => this.repo.findByIdAndOwner(id, ownerId)));
    if (owned.some((deal) => deal === null)) {
      throw AppError.notFound('Deal');
    }
    return this.repo.reorder(ownerId, input.updates);
  }

  async addItem(ownerId: string, dealId: string, input: CreateDealItemInput): Promise<DealItemWithProduct> {
    await this.get(ownerId, dealId);
    const item = await this.repo.addItem(ownerId, dealId, input);
    await this.recalcValueFromItems(ownerId, dealId);
    await this.audit.log(ownerId, 'UPDATE', 'DEAL', dealId, `Added line item "${item.description}"`);
    return item;
  }

  async updateItem(ownerId: string, dealId: string, itemId: string, input: UpdateDealItemInput): Promise<DealItemWithProduct> {
    await this.get(ownerId, dealId);
    await this.getItem(ownerId, itemId);
    const item = await this.repo.updateItem(itemId, ownerId, input);
    await this.recalcValueFromItems(ownerId, dealId);
    await this.audit.log(ownerId, 'UPDATE', 'DEAL', dealId, `Updated line item "${item.description}"`);
    return item;
  }

  async deleteItem(ownerId: string, dealId: string, itemId: string): Promise<void> {
    await this.get(ownerId, dealId);
    const item = await this.getItem(ownerId, itemId);
    await this.repo.deleteItem(itemId, ownerId);
    await this.recalcValueFromItems(ownerId, dealId);
    await this.audit.log(ownerId, 'UPDATE', 'DEAL', dealId, `Removed line item "${item.description}"`);
  }

  private async getItem(ownerId: string, itemId: string): Promise<DealItemWithProduct> {
    const item = await this.repo.findItemByIdAndOwner(itemId, ownerId);
    if (!item) throw AppError.notFound('Deal item');
    return item;
  }

  private async recalcValueFromItems(ownerId: string, dealId: string): Promise<void> {
    const total = await this.repo.sumItemTotals(dealId);
    await this.repo.setValue(dealId, ownerId, total);
  }

  private async assertRelationsOwned(ownerId: string, contactId: string | null, companyId: string | null): Promise<void> {
    if (contactId) {
      const owned = await this.repo.relationOwnedByOwner('contact', contactId, ownerId);
      if (!owned) throw AppError.notFound('Contact');
    }
    if (companyId) {
      const owned = await this.repo.relationOwnedByOwner('company', companyId, ownerId);
      if (!owned) throw AppError.notFound('Company');
    }
  }
}
