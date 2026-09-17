import { describe, expect, it, vi } from 'vitest';
import { DealsService } from './deals.service';
import type { IDealsRepository, DealWithRelations } from './deals.repository';
import type { ReorderDealsInput } from './deals.schemas';
import { AppError } from '../../common/utils/app-error';

function buildFakeRepo(overrides: Partial<IDealsRepository> = {}): IDealsRepository {
  const deal = { id: 'd1', ownerId: 'u1', stage: 'NEW' } as DealWithRelations;
  return {
    list: vi.fn(),
    findByIdAndOwner: vi.fn().mockResolvedValue(deal),
    maxPositionInStage: vi.fn().mockResolvedValue(4),
    relationOwnedByOwner: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockImplementation((_ownerId: string, input: { stage?: string; position?: number }) => ({
      ...deal,
      stage: input.stage ?? 'NEW',
      position: input.position ?? 1
    })),
    update: vi.fn().mockResolvedValue(deal),
    delete: vi.fn(),
    reorder: vi.fn().mockResolvedValue([deal]),
    ...overrides
  };
}

describe('DealsService', () => {
  it('assigns next position in stage on create', async () => {
    const repo = buildFakeRepo();
    const service = new DealsService(repo);
    const created = await service.create('u1', { title: 'New deal', value: 1000, stage: 'NEW' });
    expect(created.position).toBe(5);
    expect(repo.maxPositionInStage).toHaveBeenCalledWith('u1', 'NEW');
  });

  it('defaults to NEW stage when none provided', async () => {
    const repo = buildFakeRepo({ maxPositionInStage: vi.fn().mockResolvedValue(0) });
    const service = new DealsService(repo);
    const created = await service.create('u1', { title: 'Untaged', value: 0 });
    expect(created.stage).toBe('NEW');
    expect(created.position).toBe(1);
  });

  it('rejects reorder when a deal is not owned by the requester', async () => {
    const repo = buildFakeRepo({ findByIdAndOwner: vi.fn().mockResolvedValue(null) });
    const service = new DealsService(repo);
    const input: ReorderDealsInput = { updates: [{ id: 'd1', stage: 'WON', position: 0 }] };
    await expect(service.reorder('u1', input)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(repo.reorder).not.toHaveBeenCalled();
  });

  it('passes validated updates to the repository on reorder', async () => {
    const repo = buildFakeRepo();
    const service = new DealsService(repo);
    const input: ReorderDealsInput = {
      updates: [
        { id: 'd1', stage: 'PROPOSAL', position: 0 },
        { id: 'd2', stage: 'PROPOSAL', position: 1 }
      ]
    };
    await service.reorder('u1', input);
    expect(repo.reorder).toHaveBeenCalledWith('u1', [
      { id: 'd1', stage: 'PROPOSAL', position: 0 },
      { id: 'd2', stage: 'PROPOSAL', position: 1 }
    ]);
  });

  it('rejects create referencing a contact owned by someone else', async () => {
    const repo = buildFakeRepo({ relationOwnedByOwner: vi.fn().mockResolvedValue(false) });
    const service = new DealsService(repo);
    await expect(service.create('u1', { title: 'X', value: 1, contactId: 'c-other' })).rejects.toBeInstanceOf(AppError);
    expect(repo.create).not.toHaveBeenCalled();
  });
});
