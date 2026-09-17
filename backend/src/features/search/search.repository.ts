import type { PrismaService } from '../../database/prisma';

export interface SearchResults {
  contacts: { id: string; name: string; email: string | null }[];
  companies: { id: string; name: string; domain: string | null }[];
  deals: { id: string; title: string; stage: string; value: number; currency: string }[];
}

export interface ISearchRepository {
  search(ownerId: string, q: string): Promise<SearchResults>;
}

export class SearchRepository implements ISearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(ownerId: string, q: string): Promise<SearchResults> {
    const [contacts, companies, deals] = await Promise.all([
      this.prisma.contact.findMany({
        where: { ownerId, OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] },
        select: { id: true, name: true, email: true },
        take: 5,
        orderBy: { name: 'asc' }
      }),
      this.prisma.company.findMany({
        where: { ownerId, OR: [{ name: { contains: q, mode: 'insensitive' } }, { domain: { contains: q, mode: 'insensitive' } }] },
        select: { id: true, name: true, domain: true },
        take: 5,
        orderBy: { name: 'asc' }
      }),
      this.prisma.deal.findMany({
        where: { ownerId, title: { contains: q, mode: 'insensitive' } },
        select: { id: true, title: true, stage: true, value: true, currency: true },
        take: 5,
        orderBy: { updatedAt: 'desc' }
      })
    ]);
    return { contacts, companies, deals };
  }
}
