import { AppError } from '../../common/utils/app-error';
import type { AuditLogger } from '../../common/utils/audit-logger';
import type { Company, CompanyDetail, ICompaniesRepository } from './companies.repository';
import type { CreateCompanyInput, ListCompaniesQuery, UpdateCompanyInput } from './companies.schemas';

export class CompaniesService {
  constructor(
    private readonly repo: ICompaniesRepository,
    private readonly audit: AuditLogger
  ) {}

  list(ownerId: string, query: ListCompaniesQuery): Promise<{ items: Company[]; total: number }> {
    return this.repo.list({ ownerId, search: query.search, page: query.page, pageSize: query.pageSize });
  }

  async get(ownerId: string, id: string): Promise<{ id: string; ownerId: string }> {
    const company = await this.repo.findByIdAndOwner(id, ownerId);
    if (!company) throw AppError.notFound('Company');
    return company;
  }

  async getDetail(ownerId: string, id: string): Promise<CompanyDetail> {
    const company = await this.repo.findDetailByIdAndOwner(id, ownerId);
    if (!company) throw AppError.notFound('Company');
    return company;
  }

  async create(ownerId: string, input: CreateCompanyInput): Promise<Company> {
    const company = await this.repo.create(ownerId, input);
    await this.audit.log(ownerId, 'CREATE', 'COMPANY', company.id, `Created company "${company.name}"`);
    return company;
  }

  async update(ownerId: string, id: string, input: UpdateCompanyInput): Promise<Company> {
    await this.get(ownerId, id);
    const company = await this.repo.update(id, ownerId, input);
    await this.audit.log(ownerId, 'UPDATE', 'COMPANY', id, `Updated company "${company.name}"`);
    return company;
  }

  async delete(ownerId: string, id: string): Promise<void> {
    const company = await this.repo.findDetailByIdAndOwner(id, ownerId);
    if (!company) throw AppError.notFound('Company');
    await this.repo.delete(id, ownerId);
    await this.audit.log(ownerId, 'DELETE', 'COMPANY', id, `Deleted company "${company.name}"`);
  }
}
