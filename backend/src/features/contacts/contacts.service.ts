import { AppError } from '../../common/utils/app-error';
import type { AuditLogger } from '../../common/utils/audit-logger';
import type { ContactDetail, ContactWithCompany, IContactsRepository } from './contacts.repository';
import type { CreateContactInput, ListContactsQuery, SetContactTagsInput, UpdateContactInput } from './contacts.schemas';

export interface TagsOwnershipChecker {
  assertAllOwned(tagIds: string[], ownerId: string): Promise<void>;
}

export class ContactsService {
  constructor(
    private readonly repo: IContactsRepository,
    private readonly companies: { companyOwnedByOwner(companyId: string, ownerId: string): Promise<boolean> },
    private readonly tags: TagsOwnershipChecker,
    private readonly audit: AuditLogger
  ) {}

  async list(ownerId: string, query: ListContactsQuery): Promise<{ items: ContactWithCompany[]; total: number }> {
    return this.repo.list({
      ownerId,
      search: query.search,
      status: query.status,
      companyId: query.companyId,
      page: query.page,
      pageSize: query.pageSize
    });
  }

  listAll(ownerId: string): Promise<ContactWithCompany[]> {
    return this.repo.listAll(ownerId);
  }

  async get(ownerId: string, id: string): Promise<ContactWithCompany> {
    const contact = await this.repo.findByIdAndOwner(id, ownerId);
    if (!contact) throw AppError.notFound('Contact');
    return contact;
  }

  async getDetail(ownerId: string, id: string): Promise<ContactDetail> {
    const contact = await this.repo.findDetailByIdAndOwner(id, ownerId);
    if (!contact) throw AppError.notFound('Contact');
    return contact;
  }

  async create(ownerId: string, input: CreateContactInput): Promise<ContactWithCompany> {
    await this.assertCompanyOwned(input.companyId ?? null, ownerId);
    const contact = await this.repo.create(ownerId, input);
    await this.audit.log(ownerId, 'CREATE', 'CONTACT', contact.id, `Created contact "${contact.name}"`);
    return contact;
  }

  async update(ownerId: string, id: string, input: UpdateContactInput): Promise<ContactWithCompany> {
    await this.get(ownerId, id);
    if (input.companyId !== undefined) {
      await this.assertCompanyOwned(input.companyId ?? null, ownerId);
    }
    const contact = await this.repo.update(id, ownerId, input);
    await this.audit.log(ownerId, 'UPDATE', 'CONTACT', id, `Updated contact "${contact.name}"`);
    return contact;
  }

  async setTags(ownerId: string, id: string, input: SetContactTagsInput): Promise<ContactWithCompany> {
    await this.get(ownerId, id);
    await this.tags.assertAllOwned(input.tagIds, ownerId);
    const contact = await this.repo.setTags(id, ownerId, input.tagIds);
    await this.audit.log(ownerId, 'UPDATE', 'CONTACT', id, `Set ${input.tagIds.length} tags on "${contact.name}"`);
    return contact;
  }

  async delete(ownerId: string, id: string): Promise<void> {
    const contact = await this.get(ownerId, id);
    await this.repo.delete(id, ownerId);
    await this.audit.log(ownerId, 'DELETE', 'CONTACT', id, `Deleted contact "${contact.name}"`);
  }

  private async assertCompanyOwned(companyId: string | null, ownerId: string): Promise<void> {
    if (!companyId) return;
    const owned = await this.companies.companyOwnedByOwner(companyId, ownerId);
    if (!owned) throw AppError.notFound('Company');
  }
}
