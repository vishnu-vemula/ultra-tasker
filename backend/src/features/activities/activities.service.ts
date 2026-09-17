import { AppError } from '../../common/utils/app-error';
import type { AuditLogger } from '../../common/utils/audit-logger';
import type { ActivityWithRelations, IActivitiesRepository } from './activities.repository';
import type { CreateActivityInput, ListActivitiesQuery, UpdateActivityInput } from './activities.schemas';

export class ActivitiesService {
  constructor(
    private readonly repo: IActivitiesRepository,
    private readonly audit: AuditLogger
  ) {}

  list(ownerId: string, query: ListActivitiesQuery): Promise<{ items: ActivityWithRelations[]; total: number }> {
    return this.repo.list({ ...query, ownerId });
  }

  async get(ownerId: string, id: string): Promise<ActivityWithRelations> {
    const activity = await this.repo.findByIdAndOwner(id, ownerId);
    if (!activity) throw AppError.notFound('Activity');
    return activity;
  }

  async create(ownerId: string, input: CreateActivityInput): Promise<ActivityWithRelations> {
    await this.assertRelationsOwned(ownerId, input.contactId ?? null, input.dealId ?? null, input.companyId ?? null);
    const activity = await this.repo.create(ownerId, input);
    if (activity.contactId) {
      await this.repo.touchContactLastActivity(activity.contactId, ownerId, activity.occurredAt);
    }
    await this.audit.log(ownerId, 'CREATE', 'ACTIVITY', activity.id, `${activity.type}: ${activity.title}`);
    return activity;
  }

  async update(ownerId: string, id: string, input: UpdateActivityInput): Promise<ActivityWithRelations> {
    await this.get(ownerId, id);
    if (input.contactId !== undefined || input.dealId !== undefined || input.companyId !== undefined) {
      await this.assertRelationsOwned(ownerId, input.contactId ?? null, input.dealId ?? null, input.companyId ?? null);
    }
    const activity = await this.repo.update(id, ownerId, input);
    if (activity.contactId) {
      await this.repo.touchContactLastActivity(activity.contactId, ownerId, activity.occurredAt);
    }
    await this.audit.log(ownerId, 'UPDATE', 'ACTIVITY', id, `Updated ${activity.type}: ${activity.title}`);
    return activity;
  }

  async delete(ownerId: string, id: string): Promise<void> {
    const activity = await this.get(ownerId, id);
    await this.repo.delete(id, ownerId);
    await this.audit.log(ownerId, 'DELETE', 'ACTIVITY', id, `Deleted ${activity.type}: ${activity.title}`);
  }

  private async assertRelationsOwned(
    ownerId: string,
    contactId: string | null,
    dealId: string | null,
    companyId: string | null
  ): Promise<void> {
    if (contactId && !(await this.repo.relationOwnedByOwner('contact', contactId, ownerId))) {
      throw AppError.notFound('Contact');
    }
    if (dealId && !(await this.repo.relationOwnedByOwner('deal', dealId, ownerId))) {
      throw AppError.notFound('Deal');
    }
    if (companyId && !(await this.repo.relationOwnedByOwner('company', companyId, ownerId))) {
      throw AppError.notFound('Company');
    }
  }
}
