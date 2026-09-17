import { AppError } from '../../common/utils/app-error';
import type { AuditLogger } from '../../common/utils/audit-logger';
import type { Product } from '@prisma/client';
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from './products.schemas';
import type { IProductsRepository } from './products.repository';

export class ProductsService {
  constructor(
    private readonly repo: IProductsRepository,
    private readonly audit: AuditLogger
  ) {}

  list(ownerId: string, query: ListProductsQuery): Promise<Product[]> {
    return this.repo.list({ ownerId, search: query.search });
  }

  async get(ownerId: string, id: string): Promise<Product> {
    const product = await this.repo.findByIdAndOwner(id, ownerId);
    if (!product) throw AppError.notFound('Product');
    return product;
  }

  async create(ownerId: string, input: CreateProductInput): Promise<Product> {
    const product = await this.repo.create(ownerId, input);
    await this.audit.log(ownerId, 'CREATE', 'PRODUCT', product.id, `Created product "${product.name}"`);
    return product;
  }

  async update(ownerId: string, id: string, input: UpdateProductInput): Promise<Product> {
    await this.get(ownerId, id);
    const product = await this.repo.update(id, ownerId, input);
    await this.audit.log(ownerId, 'UPDATE', 'PRODUCT', id, `Updated product "${product.name}"`);
    return product;
  }

  async delete(ownerId: string, id: string): Promise<void> {
    await this.get(ownerId, id);
    await this.repo.delete(id, ownerId);
    await this.audit.log(ownerId, 'DELETE', 'PRODUCT', id, 'Deleted product');
  }
}
