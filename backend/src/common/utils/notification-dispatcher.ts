import type { NotificationType } from '@prisma/client';

export interface NotificationInput {
  type: NotificationType;
  title: string;
  body?: string | null;
  dedupeKey?: string | null;
}

export interface NotificationDispatcher {
  dispatch(ownerId: string, input: NotificationInput): Promise<void>;
}
