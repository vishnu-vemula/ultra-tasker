import type { Response } from 'express';
import type { ProductsService } from './products.service';
import { createProductSchema, listProductsQuerySchema, updateProductSchema } from './products.schemas';
import { asyncHandler, requireUser } from '../../common/utils/async-handler';
import { AppError } from '../../common/utils/app-error';

export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  list = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const query = listProductsQuerySchema.parse(req.query);
    const items = await this.products.list(user.uid, query);
    res.json({ data: { items, total: items.length } });
  });

  get = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Product');
    res.json({ data: await this.products.get(user.uid, id) });
  });

  create = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const input = createProductSchema.parse(req.body);
    res.status(201).json({ data: await this.products.create(user.uid, input) });
  });

  update = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Product');
    const input = updateProductSchema.parse(req.body);
    res.json({ data: await this.products.update(user.uid, id, input) });
  });

  remove = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Product');
    await this.products.delete(user.uid, id);
    res.status(204).send();
  });
}
