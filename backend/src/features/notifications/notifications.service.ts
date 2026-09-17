import type { Notification } from '@prisma/client';
import type { NotificationDispatcher, NotificationInput } from '../../common/utils/notification-dispatcher';
import type { INotificationsRepository } from './notifications.repository';
import type { MarkReadInput } from './notifications.schemas';

export interface OverdueTaskSource {
  findOverdue(ownerId: string): Promise<{ id: string; title: string }[]>;
}

export class NotificationsService implements NotificationDispatcher {
  constructor(
    private readonly repo: INotificationsRepository,
    private readonly tasksSource: OverdueTaskSource
  ) {}

  async list(ownerId: string): Promise<{ items: Notification[]; unread: number }> {
    await this.syncOverdueTasks(ownerId);
    const [items, unread] = await Promise.all([this.repo.listRecent(ownerId), this.repo.countUnread(ownerId)]);
    return { items, unread };
  }

  async markRead(ownerId: string, input: MarkReadInput): Promise<{ items: Notification[]; unread: number }> {
    if (input.all) {
      await this.repo.markRead(ownerId, 'all');
    } else if (input.ids) {
      await this.repo.markRead(ownerId, input.ids);
    }
    const [items, unread] = await Promise.all([this.repo.listRecent(ownerId), this.repo.countUnread(ownerId)]);
    return { items, unread };
  }

  async dispatch(ownerId: string, input: NotificationInput): Promise<void> {
    await this.repo.createIfNotExists(ownerId, {
      type: input.type,
      title: input.title,
      body: input.body ?? undefined,
      dedupeKey: input.dedupeKey ?? undefined
    });
  }

  private async syncOverdueTasks(ownerId: string): Promise<void> {
    const overdue = await this.tasksSource.findOverdue(ownerId);
    for (const task of overdue) {
      await this.repo.createIfNotExists(ownerId, {
        type: 'TASK_OVERDUE',
        title: `Task overdue: ${task.title}`,
        dedupeKey: `task-overdue:${task.id}`
      });
    }
  }
}
