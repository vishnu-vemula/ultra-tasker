import type { Response } from 'express';
import type { ContactsService } from './contacts.service';
import {
  createContactSchema,
  listContactsQuerySchema,
  setContactTagsSchema,
  updateContactSchema
} from './contacts.schemas';
import { asyncHandler, requireUser } from '../../common/utils/async-handler';
import { AppError } from '../../common/utils/app-error';

const csvEscape = (value: string | number | null): string => {
  if (value === null) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

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
    res.json({ data: await this.contacts.getDetail(user.uid, id) });
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

  setTags = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Contact');
    const input = setContactTagsSchema.parse(req.body);
    res.json({ data: await this.contacts.setTags(user.uid, id, input) });
  });

  remove = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { id } = req.params;
    if (!id) throw AppError.notFound('Contact');
    await this.contacts.delete(user.uid, id);
    res.status(204).send();
  });

  exportCsv = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const contacts = await this.contacts.listAll(user.uid);
    const header = ['Name', 'Email', 'Phone', 'Position', 'Status', 'Company', 'Website', 'City', 'Country', 'Source', 'Tags', 'CreatedAt'];
    const rows = contacts.map((contact) => [
      contact.name,
      contact.email,
      contact.phone,
      contact.position,
      contact.status,
      contact.company?.name ?? '',
      contact.website,
      contact.city,
      contact.country,
      contact.source ?? '',
      contact.tags.map((tag) => tag.name).join('; '),
      contact.createdAt.toISOString()
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
    res.send(csv);
  });
}
