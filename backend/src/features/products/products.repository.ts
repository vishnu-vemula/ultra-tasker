import type { Prisma, Product } from '@prisma/client';
import type { PrismaService } from '../../database/prisma';

export interface ListProductsInput {
  ownerId: string;
  search?: string;
}

export interface CreateProductData {
  name: string;
  sku?: string | null;
  price: number;
  currency?: string;
  active?: boolean;
}

export type UpdateProductData = Partial<CreateProductData>;

export interface IProductsRepository {
  list(input: ListProductsInput): Promise<Product[]>;
  findByIdAndOwner(id: string, ownerId: string): Promise<Product | null>;
  create(ownerId: string, input: CreateProductData): Promise<Product>;
  update(id: string, ownerId: string, input: UpdateProductData): Promise<Product>;
  delete(id: string, ownerId: string): Promise<void>;
}

export class ProductsRepository implements IProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(input: ListProductsInput): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = { ownerId: input.ownerId };
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { sku: { contains: input.search, mode: 'insensitive' } }
      ];
    }
    return this.prisma.product.findMany({ where, orderBy: { name: 'asc' } });
  }

  findByIdAndOwner(id: string, ownerId: string): Promise<Product | null> {
    return this.prisma.product.findFirst({ where: { id, ownerId } });
  }

  create(ownerId: string, input: CreateProductData): Promise<Product> {
    return this.prisma.product.create({
      data: {
        ownerId,
        name: input.name,
        sku: input.sku ?? null,
        price: input.price,
        currency: input.currency ?? 'USD',
        active: input.active ?? true
      }
    });
  }

  update(id: string, ownerId: string, input: UpdateProductData): Promise<Product> {
    return this.prisma.product.update({
      where: { id_ownerId: { id, ownerId } },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.sku !== undefined && { sku: input.sku }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.currency !== undefined && { currency: input.currency }),
        ...(input.active !== undefined && { active: input.active })
      }
    });
  }

  async delete(id: string, ownerId: string): Promise<void> {
    await this.prisma.product.delete({ where: { id_ownerId: { id, ownerId } } });
  }
}
