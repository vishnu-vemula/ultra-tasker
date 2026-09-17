import type { Response } from 'express';
import type { TasksService } from './tasks.service';
import { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from './tasks.schemas';
import { asyncHandler, requireUser } from '../../common/utils/async-handler';
import { AppError } from '../../common/utils/app-error';

export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  list = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const query = listTasksQuerySchema.parse(req.query);
    const { items, total } = await this.tasks.list(user.uid, query);
    res.json({ data: { items, total, page: query.page, pageSize: query.pageSize } });
  });

  get = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Task');
    res.json({ data: await this.tasks.get(user.uid, id) });
  });

  create = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const input = createTaskSchema.parse(req.body);
    res.status(201).json({ data: await this.tasks.create(user.uid, input) });
  });

  update = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Task');
    const input = updateTaskSchema.parse(req.body);
    res.json({ data: await this.tasks.update(user.uid, id, input) });
  });

  remove = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Task');
    await this.tasks.delete(user.uid, id);
    res.status(204).send();
  });
}
