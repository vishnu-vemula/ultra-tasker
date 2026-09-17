import { describe, expect, it, vi } from 'vitest';
import { ActivitiesService } from './activities.service';
import type { ActivityWithRelations, IActivitiesRepository } from './activities.repository';

function buildFakeRepo(overrides: Partial<IActivitiesRepository> = {}): IActivitiesRepository {
  const activity = {
    id: 'a1',
    ownerId: 'u1',
    type: 'CALL',
    title: 'Discovery call',
    occurredAt: new Date('2026-01-10T10:00:00Z'),
    contactId: 'c1'
  } as ActivityWithRelations;
  return {
    list: vi.fn().mockResolvedValue({ items: [activity], total: 1 }),
    findByIdAndOwner: vi.fn().mockResolvedValue(activity),
    relationOwnedByOwner: vi.fn().mockResolvedValue(true),
    touchContactLastActivity: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(activity),
    update: vi.fn().mockResolvedValue(activity),
    delete: vi.fn(),
    ...overrides
  };
}

const audit = { log: vi.fn().mockResolvedValue(undefined) };

describe('ActivitiesService', () => {
  it('touches contact lastActivityAt when the activity links to a contact', async () => {
    const repo = buildFakeRepo();
    const service = new ActivitiesService(repo, audit);
    await service.create('u1', { type: 'CALL', title: 'Discovery call', contactId: 'c1' });
    expect(repo.touchContactLastActivity).toHaveBeenCalledWith(
      'c1',
      'u1',
      new Date('2026-01-10T10:00:00Z')
    );
  });

  it('does not touch contacts when the activity has no contact', async () => {
    const repo = buildFakeRepo();
    const created = { id: 'a2', ownerId: 'u1', type: 'NOTE', title: 'Note', occurredAt: new Date(), contactId: null } as ActivityWithRelations;
    repo.create = vi.fn().mockResolvedValue(created);
    const service = new ActivitiesService(repo, audit);
    await service.create('u1', { type: 'NOTE', title: 'Note' });
    expect(repo.touchContactLastActivity).not.toHaveBeenCalled();
  });

  it('rejects activities linked to a deal owned by someone else', async () => {
    const repo = buildFakeRepo({ relationOwnedByOwner: vi.fn().mockResolvedValue(false) });
    const service = new ActivitiesService(repo, audit);
    await expect(service.create('u1', { type: 'NOTE', title: 'X', dealId: 'foreign' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(repo.create).not.toHaveBeenCalled();
  });
});
