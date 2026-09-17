import { AppError } from '../../common/utils/app-error';
import type { AuditLogger } from '../../common/utils/audit-logger';
import type { Tag } from '@prisma/client';
import type { CreateTagInput, UpdateTagInput } from './tags.schemas';
import type { ITagsRepository } from './tags.repository';

export class TagsService {
  constructor(
    private readonly repo: ITagsRepository,
    private readonly audit: AuditLogger
  ) {}

  list(ownerId: string): Promise<Tag[]> {
    return this.repo.list(ownerId);
  }

  async create(ownerId: string, input: CreateTagInput): Promise<Tag> {
    const tag = await this.repo.create(ownerId, input);
    await this.audit.log(ownerId, 'CREATE', 'TAG', tag.id, `Created tag "${tag.name}"`);
    return tag;
  }

  async update(ownerId: string, id: string, input: UpdateTagInput): Promise<Tag> {
    const tag = await this.repo.update(id, ownerId, input);
    await this.audit.log(ownerId, 'UPDATE', 'TAG', id, `Updated tag "${tag.name}"`);
    return tag;
  }

  async delete(ownerId: string, id: string): Promise<void> {
    await this.repo.delete(id, ownerId);
    await this.audit.log(ownerId, 'DELETE', 'TAG', id, 'Deleted tag');
  }

  async assertAllOwned(tagIds: string[], ownerId: string): Promise<void> {
    if (tagIds.length === 0) return;
    const owned = await this.repo.countOwned(tagIds, ownerId);
    if (owned !== tagIds.length) {
      throw new AppError(422, 'INVALID_TAG', 'One or more tags do not exist');
    }
  }
}
