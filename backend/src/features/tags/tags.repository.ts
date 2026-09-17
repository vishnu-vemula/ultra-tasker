import type { Prisma, Tag } from '@prisma/client';
import type { PrismaService } from '../../database/prisma';

export interface ITagsRepository {
  list(ownerId: string): Promise<Tag[]>;
  countOwned(tagIds: string[], ownerId: string): Promise<number>;
  create(ownerId: string, input: { name: string; color?: string }): Promise<Tag>;
  update(id: string, ownerId: string, input: { name?: string; color?: string }): Promise<Tag>;
  delete(id: string, ownerId: string): Promise<void>;
}

export class TagsRepository implements ITagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(ownerId: string): Promise<Tag[]> {
    return this.prisma.tag.findMany({ where: { ownerId }, orderBy: { name: 'asc' } });
  }

  countOwned(tagIds: string[], ownerId: string): Promise<number> {
    return this.prisma.tag.count({ where: { id: { in: tagIds }, ownerId } });
  }

  create(ownerId: string, input: { name: string; color?: string }): Promise<Tag> {
    return this.prisma.tag.create({
      data: { ownerId, name: input.name, color: input.color ?? '#6366f1' }
    });
  }

  update(id: string, ownerId: string, input: { name?: string; color?: string }): Promise<Tag> {
    return this.prisma.tag.update({ where: { id_ownerId: { id, ownerId } }, data: input });
  }

  async delete(id: string, ownerId: string): Promise<void> {
    await this.prisma.tag.delete({ where: { id_ownerId: { id, ownerId } } });
  }
}

export type { Prisma };
