import type { Response } from 'express';
import type { ContactsService } from './contacts.service';
import { createContactSchema, listContactsQuerySchema, updateContactSchema } from './contacts.schemas';
import { asyncHandler, requireUser } from '../../common/utils/async-handler';
import { AppError } from '../../common/utils/app-error';

export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  list = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const query = listContactsQuerySchema.parse(req.query);
    const { items, total } = await this.contacts.list(user.uid, query);
    res.json({ data: { items, total, page: query.page, pageSize: query.pageSize } });
  });

  get = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Contact');
    res.json({ data: await this.contacts.get(user.uid, id) });
  });

  create = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const input = createContactSchema.parse(req.body);
    res.status(201).json({ data: await this.contacts.create(user.uid, input) });
  });

  update = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Contact');
    const input = updateContactSchema.parse(req.body);
    res.json({ data: await this.contacts.update(user.uid, id, input) });
  });

  remove = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Contact');
    await this.contacts.delete(user.uid, id);
    res.status(204).send();
  });
}
