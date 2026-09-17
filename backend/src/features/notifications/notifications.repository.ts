import type { Notification, NotificationType, Prisma } from '@prisma/client';
import type { PrismaService } from '../../database/prisma';
import type { NotificationInput } from '../../common/utils/notification-dispatcher';

export interface INotificationsRepository {
  createIfNotExists(ownerId: string, input: Required<Pick<NotificationInput, 'type' | 'title'>> & NotificationInput): Promise<Notification>;
  listRecent(ownerId: string): Promise<Notification[]>;
  countUnread(ownerId: string): Promise<number>;
  markRead(ownerId: string, ids: string[] | 'all'): Promise<number>;
}

export class NotificationsRepository implements INotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createIfNotExists(
    ownerId: string,
    input: Required<Pick<NotificationInput, 'type' | 'title'>> & NotificationInput
  ): Promise<Notification> {
    const dedupeKey = input.dedupeKey ?? `adhoc:${input.type}:${Date.now()}`;
    return this.prisma.notification.upsert({
      where: { ownerId_dedupeKey: { ownerId, dedupeKey } },
      create: {
        ownerId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        dedupeKey
      },
      update: {}
    });
  }

  listRecent(ownerId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  countUnread(ownerId: string): Promise<number> {
    return this.prisma.notification.count({ where: { ownerId, readAt: null } });
  }

  async markRead(ownerId: string, ids: string[] | 'all'): Promise<number> {
    const where: Prisma.NotificationWhereInput =
      ids === 'all' ? { ownerId, readAt: null } : { ownerId, id: { in: ids }, readAt: null };
    const result = await this.prisma.notification.updateMany({ where, data: { readAt: new Date() } });
    return result.count;
  }
}

export type { NotificationType };
