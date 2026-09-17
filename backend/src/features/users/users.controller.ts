import type { Response } from 'express';
import type { UsersService } from './users.service';
import { listUsersQuerySchema, setRoleSchema } from './users.schemas';
import { asyncHandler, requireUser } from '../../common/utils/async-handler';
import { AppError } from '../../common/utils/app-error';

export class UsersController {
  constructor(private readonly users: UsersService) {}

  list = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const query = listUsersQuerySchema.parse(req.query);
    const { items, total } = await this.users.list(user.uid, query);
    res.json({ data: { items, total, page: query.page, pageSize: query.pageSize } });
  });

  setRole = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw new AppError(404, 'NOT_FOUND', 'User not found');
    const { role } = setRoleSchema.parse(req.body);
    const updated = await this.users.setRole(user.uid, id, role);
    res.json({ data: updated });
  });
}
