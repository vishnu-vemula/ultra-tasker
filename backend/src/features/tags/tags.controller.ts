import type { Response } from 'express';
import type { TagsService } from './tags.service';
import { createTagSchema, updateTagSchema } from './tags.schemas';
import { asyncHandler, requireUser } from '../../common/utils/async-handler';
import { AppError } from '../../common/utils/app-error';

export class TagsController {
  constructor(private readonly tags: TagsService) {}

  list = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const items = await this.tags.list(user.uid);
    res.json({ data: { items, total: items.length } });
  });

  create = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const input = createTagSchema.parse(req.body);
    res.status(201).json({ data: await this.tags.create(user.uid, input) });
  });

  update = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Tag');
    const input = updateTagSchema.parse(req.body);
    res.json({ data: await this.tags.update(user.uid, id, input) });
  });

  remove = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Tag');
    await this.tags.delete(user.uid, id);
    res.status(204).send();
  });
}
