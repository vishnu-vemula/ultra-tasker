import { AppError } from '../../common/utils/app-error';
import type { DealWithRelations, IDealsRepository } from './deals.repository';
import type { CreateDealInput, ListDealsQuery, ReorderDealsInput, UpdateDealInput } from './deals.schemas';

export class DealsService {
  constructor(private readonly repo: IDealsRepository) {}

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

  async create(ownerId: string, input: CreateDealInput): Promise<DealWithRelations> {
    await this.assertRelationsOwned(ownerId, input.contactId ?? null, input.companyId ?? null);
    const stage = input.stage ?? 'NEW';
    const maxPosition = await this.repo.maxPositionInStage(ownerId, stage);
    return this.repo.create(ownerId, { ...input, stage, position: maxPosition + 1 });
  }

  async update(ownerId: string, id: string, input: UpdateDealInput): Promise<DealWithRelations> {
    await this.get(ownerId, id);
    if (input.contactId !== undefined || input.companyId !== undefined) {
      await this.assertRelationsOwned(ownerId, input.contactId ?? null, input.companyId ?? null);
    }
    return this.repo.update(id, ownerId, input);
  }

  async delete(ownerId: string, id: string): Promise<void> {
    await this.get(ownerId, id);
    await this.repo.delete(id, ownerId);
  }

  async reorder(ownerId: string, input: ReorderDealsInput): Promise<DealWithRelations[]> {
    const ids = input.updates.map((update) => update.id);
    const owned = await Promise.all(ids.map((id) => this.repo.findByIdAndOwner(id, ownerId)));
    const missing = ids.filter((_id, index) => owned[index] === null);
    if (missing.length > 0) {
      throw AppError.notFound('Deal');
    }
    return this.repo.reorder(ownerId, input.updates);
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
