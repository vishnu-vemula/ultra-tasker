import type { Response } from 'express';
import type { ActivitiesService } from './activities.service';
import { createActivitySchema, listActivitiesQuerySchema, updateActivitySchema } from './activities.schemas';
import { asyncHandler, requireUser } from '../../common/utils/async-handler';
import { AppError } from '../../common/utils/app-error';

export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  list = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const query = listActivitiesQuerySchema.parse(req.query);
    const { items, total } = await this.activities.list(user.uid, query);
    res.json({ data: { items, total, page: query.page, pageSize: query.pageSize } });
  });

  get = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Activity');
    res.json({ data: await this.activities.get(user.uid, id) });
  });

  create = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const input = createActivitySchema.parse(req.body);
    res.status(201).json({ data: await this.activities.create(user.uid, input) });
  });

  update = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Activity');
    const input = updateActivitySchema.parse(req.body);
    res.json({ data: await this.activities.update(user.uid, id, input) });
  });

  remove = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Activity');
    await this.activities.delete(user.uid, id);
    res.status(204).send();
  });
}
