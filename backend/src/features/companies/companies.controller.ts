import type { Response } from 'express';
import type { CompaniesService } from './companies.service';
import { createCompanySchema, listCompaniesQuerySchema, updateCompanySchema } from './companies.schemas';
import { asyncHandler, requireUser } from '../../common/utils/async-handler';
import { AppError } from '../../common/utils/app-error';

export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  list = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const query = listCompaniesQuerySchema.parse(req.query);
    const { items, total } = await this.companies.list(user.uid, query);
    res.json({ data: { items, total, page: query.page, pageSize: query.pageSize } });
  });

  get = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Company');
    res.json({ data: await this.companies.getDetail(user.uid, id) });
  });

  create = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const input = createCompanySchema.parse(req.body);
    res.status(201).json({ data: await this.companies.create(user.uid, input) });
  });

  update = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Company');
    const input = updateCompanySchema.parse(req.body);
    res.json({ data: await this.companies.update(user.uid, id, input) });
  });

  remove = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Company');
    await this.companies.delete(user.uid, id);
    res.status(204).send();
  });
}
