import { describe, expect, it, vi } from 'vitest';
import { DealsService } from './deals.service';
import type { IDealsRepository, DealWithRelations, DealItemWithProduct } from './deals.repository';
import type { ReorderDealsInput } from './deals.schemas';

function buildFakeRepo(overrides: Partial<IDealsRepository> = {}): IDealsRepository {
  const deal = { id: 'd1', ownerId: 'u1', stage: 'NEW', title: 'Deal one' } as DealWithRelations;
  return {
    list: vi.fn(),
    findByIdAndOwner: vi.fn().mockResolvedValue(deal),
    findDetailByIdAndOwner: vi.fn().mockResolvedValue(deal),
    maxPositionInStage: vi.fn().mockResolvedValue(4),
    relationOwnedByOwner: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockImplementation((_ownerId: string, input: { stage?: string; position?: number; probability?: number }) => ({
      ...deal,
      stage: input.stage ?? 'NEW',
      position: input.position ?? 1,
      probability: input.probability ?? 10
    })),
    update: vi.fn().mockImplementation((_id: string, _ownerId: string, input: { stage?: string }) => ({
      ...deal,
      ...(input.stage !== undefined ? { stage: input.stage } : {})
    })),
    delete: vi.fn(),
    reorder: vi.fn().mockResolvedValue([deal]),
    setTags: vi.fn().mockResolvedValue(deal),
    addItem: vi.fn().mockResolvedValue({ id: 'i1', description: 'Item', quantity: 2, unitPrice: 10 } as DealItemWithProduct),
    findItemByIdAndOwner: vi.fn().mockResolvedValue({ id: 'i1', description: 'Item', quantity: 2, unitPrice: 10 } as DealItemWithProduct),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    sumItemTotals: vi.fn().mockResolvedValue(20),
    setValue: vi.fn(),
    ...overrides
  };
}

const buildDeps = () => ({
  audit: { log: vi.fn().mockResolvedValue(undefined) },
  notifications: { dispatch: vi.fn().mockResolvedValue(undefined) },
  tags: { assertAllOwned: vi.fn().mockResolvedValue(undefined) }
});

describe('DealsService', () => {
  it('assigns next position in stage on create', async () => {
    const repo = buildFakeRepo();
    const service = new DealsService(repo, buildDeps().audit, buildDeps().notifications, buildDeps().tags);
    const created = await service.create('u1', { title: 'New deal', value: 1000, stage: 'NEW' });
    expect(created.position).toBe(5);
    expect(repo.maxPositionInStage).toHaveBeenCalledWith('u1', 'NEW');
  });

  it('defaults probability from the stage on create', async () => {
    const repo = buildFakeRepo();
    const service = new DealsService(repo, buildDeps().audit, buildDeps().notifications, buildDeps().tags);
    const created = await service.create('u1', { title: 'Untyped', value: 0, stage: 'PROPOSAL' });
    expect(created.probability).toBe(50);
  });

  it('recalculates deal value from line items after add', async () => {
    const repo = buildFakeRepo();
    const deps = buildDeps();
    const service = new DealsService(repo, deps.audit, deps.notifications, deps.tags);
    const item = await service.addItem('u1', 'd1', { description: 'Item', quantity: 1, unitPrice: 10 });
    expect(item.quantity).toBe(2);
    expect(repo.sumItemTotals).toHaveBeenCalledWith('d1');
    expect(repo.setValue).toHaveBeenCalledWith('d1', 'u1', 20);
  });

  it('notifies and audits on stage change to WON', async () => {
    const repo = buildFakeRepo();
    const deps = buildDeps();
    const service = new DealsService(repo, deps.audit, deps.notifications, deps.tags);
    const updated = await service.update('u1', 'd1', { stage: 'WON' });
    expect(updated.stage).toBe('WON');
    expect(deps.notifications.dispatch).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ type: 'DEAL_WON', dedupeKey: 'deal-won:d1' })
    );
    expect(deps.audit.log).toHaveBeenCalledWith('u1', 'STAGE_CHANGE', 'DEAL', 'd1', 'NEW → WON');
  });

  it('does not notify when stage stays the same', async () => {
    const repo = buildFakeRepo();
    const deps = buildDeps();
    const service = new DealsService(repo, deps.audit, deps.notifications, deps.tags);
    await service.update('u1', 'd1', { title: 'Renamed' });
    expect(deps.notifications.dispatch).not.toHaveBeenCalled();
    expect(deps.audit.log).not.toHaveBeenCalledWith('u1', 'STAGE_CHANGE', 'DEAL', 'd1', expect.anything());
  });

  it('rejects reorder when a deal is not owned by the requester', async () => {
    const repo = buildFakeRepo({ findByIdAndOwner: vi.fn().mockResolvedValue(null) });
    const deps = buildDeps();
    const service = new DealsService(repo, deps.audit, deps.notifications, deps.tags);
    const input: ReorderDealsInput = { updates: [{ id: 'd1', stage: 'WON', position: 0 }] };
    await expect(service.reorder('u1', input)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(repo.reorder).not.toHaveBeenCalled();
  });

  it('verifies tag ownership before replacing tags', async () => {
    const repo = buildFakeRepo();
    const deps = buildDeps();
    const service = new DealsService(repo, deps.audit, deps.notifications, deps.tags);
    await service.setTags('u1', 'd1', { tagIds: ['t1', 't2'] });
    expect(deps.tags.assertAllOwned).toHaveBeenCalledWith(['t1', 't2'], 'u1');
    expect(repo.setTags).toHaveBeenCalledWith('d1', 'u1', ['t1', 't2']);
  });
});
