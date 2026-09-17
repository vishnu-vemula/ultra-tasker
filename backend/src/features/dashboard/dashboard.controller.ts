import type { Response } from 'express';
import type { DashboardService } from './dashboard.service';
import { asyncHandler, requireUser } from '../../common/utils/async-handler';

export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  stats = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    res.json({ data: await this.dashboard.stats(user.uid) });
  });
}
