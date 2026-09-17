import { describe, expect, it, vi } from 'vitest';
import { ContactsService } from './contacts.service';
import type { ContactWithCompany, IContactsRepository } from './contacts.repository';
import type { ListContactsQuery } from './contacts.schemas';

function buildFakeRepo(overrides: Partial<IContactsRepository> = {}): IContactsRepository {
  const contact = { id: 'c1', ownerId: 'u1', name: 'John' } as ContactWithCompany;
  return {
    list: vi.fn().mockResolvedValue({ items: [contact], total: 1 }),
    listAll: vi.fn().mockResolvedValue([contact]),
    findByIdAndOwner: vi.fn().mockResolvedValue(contact),
    findDetailByIdAndOwner: vi.fn().mockResolvedValue(contact),
    create: vi.fn().mockResolvedValue(contact),
    update: vi.fn().mockResolvedValue(contact),
    setTags: vi.fn().mockResolvedValue(contact),
    delete: vi.fn(),
    ...overrides
  };
}

const companies = { companyOwnedByOwner: vi.fn().mockResolvedValue(true) };
const audit = { log: vi.fn().mockResolvedValue(undefined) };

const baseQuery: ListContactsQuery = { page: 1, pageSize: 25 };

describe('ContactsService', () => {
  it('scopes list queries to the requesting owner', async () => {
    const repo = buildFakeRepo();
    const service = new ContactsService(repo, companies, { assertAllOwned: vi.fn() }, audit);
    await service.list('u1', { ...baseQuery, search: 'john', status: 'LEAD' });
    expect(repo.list).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'u1', search: 'john', status: 'LEAD' }));
  });

  it('blocks creating a contact linked to a company owned by someone else', async () => {
    const repo = buildFakeRepo();
    const guard = { companyOwnedByOwner: vi.fn().mockResolvedValue(false) };
    const service = new ContactsService(repo, guard, { assertAllOwned: vi.fn() }, audit);
    await expect(service.create('u1', { name: 'X', companyId: 'other-company' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws 404 when updating a contact that is not owned', async () => {
    const repo = buildFakeRepo({ findByIdAndOwner: vi.fn().mockResolvedValue(null) });
    const service = new ContactsService(repo, companies, { assertAllOwned: vi.fn() }, audit);
    await expect(service.update('u1', 'missing', { name: 'Y' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects tags not owned by the requester', async () => {
    const repo = buildFakeRepo();
    const tags = { assertAllOwned: vi.fn().mockRejectedValue(new Error('nope')) };
    const service = new ContactsService(repo, companies, tags, audit);
    await expect(service.setTags('u1', 'c1', { tagIds: ['foreign'] })).rejects.toBeInstanceOf(Error);
    expect(repo.setTags).not.toHaveBeenCalled();
  });

  it('writes an audit entry on delete', async () => {
    const repo = buildFakeRepo();
    const service = new ContactsService(repo, companies, { assertAllOwned: vi.fn() }, audit);
    await service.delete('u1', 'c1');
    expect(repo.delete).toHaveBeenCalledWith('c1', 'u1');
    expect(audit.log).toHaveBeenCalledWith('u1', 'DELETE', 'CONTACT', 'c1', 'Deleted contact "John"');
  });
});
