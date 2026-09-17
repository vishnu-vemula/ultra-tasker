import type { Response } from 'express';
import type { DealsService } from './deals.service';
import {
  createDealItemSchema,
  createDealSchema,
  listDealsQuerySchema,
  reorderDealsSchema,
  setDealTagsSchema,
  updateDealItemSchema,
  updateDealSchema
} from './deals.schemas';
import { asyncHandler, requireUser } from '../../common/utils/async-handler';
import { AppError } from '../../common/utils/app-error';

export class DealsController {
  constructor(private readonly deals: DealsService) {}

  list = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const query = listDealsQuerySchema.parse(req.query);
    const { items, total } = await this.deals.list(user.uid, query);
    res.json({ data: { items, total, page: query.page, pageSize: query.pageSize } });
  });

  get = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Deal');
    res.json({ data: await this.deals.getDetail(user.uid, id) });
  });

  create = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const input = createDealSchema.parse(req.body);
    res.status(201).json({ data: await this.deals.create(user.uid, input) });
  });

  update = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Deal');
    const input = updateDealSchema.parse(req.body);
    res.json({ data: await this.deals.update(user.uid, id, input) });
  });

  setTags = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Deal');
    const input = setDealTagsSchema.parse(req.body);
    res.json({ data: await this.deals.setTags(user.uid, id, input) });
  });

  remove = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Deal');
    await this.deals.delete(user.uid, id);
    res.status(204).send();
  });

  reorder = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const input = reorderDealsSchema.parse(req.body);
    const items = await this.deals.reorder(user.uid, input);
    res.json({ data: items });
  });

  addItem = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Deal');
    const input = createDealItemSchema.parse(req.body);
    res.status(201).json({ data: await this.deals.addItem(user.uid, id, input) });
  });

  updateItem = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id, itemId } = req.params;
    if (!id || !itemId) throw AppError.notFound('Deal item');
    const input = updateDealItemSchema.parse(req.body);
    res.json({ data: await this.deals.updateItem(user.uid, id, itemId, input) });
  });

  removeItem = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id, itemId } = req.params;
    if (!id || !itemId) throw AppError.notFound('Deal item');
    await this.deals.deleteItem(user.uid, id, itemId);
    res.status(204).send();
  });
}
