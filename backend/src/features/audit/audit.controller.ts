import type { Response } from 'express';
import type { AuditService } from './audit.service';
import { listAuditQuerySchema } from './audit.schemas';
import { asyncHandler, requireUser } from '../../common/utils/async-handler';

export class AuditController {
  constructor(private readonly audit: AuditService) {}

  list = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const query = listAuditQuerySchema.parse(req.query);
    const items = await this.audit.list(user.uid, query);
    res.json({ data: { items, total: items.length } });
  });
}
