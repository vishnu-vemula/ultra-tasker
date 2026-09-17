import type { Response } from 'express';
import type { SearchService } from './search.service';
import { searchQuerySchema } from './search.schemas';
import { asyncHandler, requireUser } from '../../common/utils/async-handler';

export class SearchController {
  constructor(private readonly search: SearchService) {}

  query = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { q } = searchQuerySchema.parse(req.query);
    res.json({ data: await this.search.search(user.uid, q) });
  });
}
