import type { ContactStatus } from '@prisma/client';
import type { AuthUser } from '../../types/express';
import { AppError } from '../../common/utils/app-error';
import type { ContactWithCompany, IContactsRepository } from './contacts.repository';
import type { CreateContactInput, ListContactsQuery, UpdateContactInput } from './contacts.schemas';

export class ContactsService {
  constructor(
    private readonly repo: IContactsRepository,
    private readonly companies: { companyOwnedByOwner(companyId: string, ownerId: string): Promise<boolean> }
  ) {}

  async list(ownerId: string, query: ListContactsQuery): Promise<{ items: ContactWithCompany[]; total: number }> {
    return this.repo.list({
      ownerId,
      search: query.search,
      status: query.status as ContactStatus | undefined,
      companyId: query.companyId,
      page: query.page,
      pageSize: query.pageSize
    });
  }

  async get(ownerId: string, id: string): Promise<ContactWithCompany> {
    const contact = await this.repo.findByIdAndOwner(id, ownerId);
    if (!contact) throw AppError.notFound('Contact');
    return contact;
  }

  async create(ownerId: string, input: CreateContactInput): Promise<ContactWithCompany> {
    await this.assertCompanyOwned(input.companyId ?? null, ownerId);
    return this.repo.create(ownerId, input);
  }

  async update(ownerId: string, id: string, input: UpdateContactInput): Promise<ContactWithCompany> {
    await this.get(ownerId, id);
    if (input.companyId !== undefined) {
      await this.assertCompanyOwned(input.companyId ?? null, ownerId);
    }
    return this.repo.update(id, ownerId, input);
  }

  async delete(ownerId: string, id: string): Promise<void> {
    await this.get(ownerId, id);
    await this.repo.delete(id, ownerId);
  }

  private async assertCompanyOwned(companyId: string | null, ownerId: string): Promise<void> {
    if (!companyId) return;
    const owned = await this.companies.companyOwnedByOwner(companyId, ownerId);
    if (!owned) throw AppError.notFound('Company');
  }

  whoami(user: AuthUser): string {
    return user.email;
  }
}
