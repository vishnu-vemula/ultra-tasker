import { AppError } from '../../common/utils/app-error';
import type { Company, ICompaniesRepository } from './companies.repository';
import type { CreateCompanyInput, ListCompaniesQuery, UpdateCompanyInput } from './companies.schemas';

export class CompaniesService {
  constructor(private readonly repo: ICompaniesRepository) {}

  list(ownerId: string, query: ListCompaniesQuery): Promise<{ items: Company[]; total: number }> {
    return this.repo.list({ ownerId, search: query.search, page: query.page, pageSize: query.pageSize });
  }

  async get(ownerId: string, id: string): Promise<{ id: string; ownerId: string }> {
    const company = await this.repo.findByIdAndOwner(id, ownerId);
    if (!company) throw AppError.notFound('Company');
    return company;
  }

  create(ownerId: string, input: CreateCompanyInput): Promise<Company> {
    return this.repo.create(ownerId, input);
  }

  async update(ownerId: string, id: string, input: UpdateCompanyInput): Promise<Company> {
    await this.get(ownerId, id);
    return this.repo.update(id, ownerId, input);
  }

  async delete(ownerId: string, id: string): Promise<void> {
    await this.get(ownerId, id);
    await this.repo.delete(id, ownerId);
  }
}
