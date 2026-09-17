import type { Response } from 'express';
import type { NotificationsService } from './notifications.service';
import { markReadSchema } from './notifications.schemas';
import { asyncHandler, requireUser } from '../../common/utils/async-handler';

export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  list = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    res.json({ data: await this.notifications.list(user.uid) });
  });

  markRead = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const input = markReadSchema.parse(req.body);
    res.json({ data: await this.notifications.markRead(user.uid, input) });
  });
}
