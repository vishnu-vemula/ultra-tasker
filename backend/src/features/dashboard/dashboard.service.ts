import type { ContactStatus, DealStage } from '@prisma/client';
import type { PrismaService } from '../../database/prisma';

const OPEN_STAGES: DealStage[] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'];
const CONTACT_STATUSES: ContactStatus[] = ['LEAD', 'QUALIFIED', 'CUSTOMER', 'CHURNED'];
const DEAL_STAGES: DealStage[] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
const REVENUE_MONTHS = 6;

function countOf(count: boolean | { _all?: number } | undefined): number {
  return typeof count === 'object' ? count._all ?? 0 : 0;
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function lastMonthKeys(count: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    keys.push(monthKey(date));
  }
  return keys;
}

export interface DashboardStats {
  contacts: { total: number; byStatus: Record<ContactStatus, number> };
  deals: { total: number; byStage: Record<DealStage, number>; pipelineValue: number; wonValue: number; avgDealSize: number };
  revenueByMonth: { month: string; total: number }[];
  topCompanies: { companyId: string | null; name: string; pipelineValue: number; dealCount: number }[];
  tasks: { total: number; open: number; overdue: number };
}

export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(ownerId: string): Promise<DashboardStats> {
    const revenueStart = new Date();
    revenueStart.setUTCDate(1);
    revenueStart.setUTCMonth(revenueStart.getUTCMonth() - (REVENUE_MONTHS - 1));

    const [contactTotal, contactGroups, dealTotal, dealGroups, pipelineAgg, wonAgg, wonDeals, companyGroups, taskTotal, taskOpen, taskOverdue] =
      await this.prisma.$transaction([
        this.prisma.contact.count({ where: { ownerId } }),
        this.prisma.contact.groupBy({
          by: ['status'],
          _count: { _all: true },
          where: { ownerId },
          orderBy: { status: 'asc' }
        }),
        this.prisma.deal.count({ where: { ownerId } }),
        this.prisma.deal.groupBy({
          by: ['stage'],
          _count: { _all: true },
          where: { ownerId },
          orderBy: { stage: 'asc' }
        }),
        this.prisma.deal.aggregate({ _sum: { value: true }, where: { ownerId, stage: { in: OPEN_STAGES } } }),
        this.prisma.deal.aggregate({ _sum: { value: true }, where: { ownerId, stage: 'WON' } }),
        this.prisma.deal.findMany({
          where: { ownerId, stage: 'WON', closedAt: { gte: revenueStart } },
          select: { closedAt: true, value: true }
        }),
        this.prisma.deal.groupBy({
          by: ['companyId'],
          _count: { _all: true },
          _sum: { value: true },
          where: { ownerId, stage: { in: OPEN_STAGES }, companyId: { not: null } },
          orderBy: { companyId: 'asc' }
        }),
        this.prisma.task.count({ where: { ownerId } }),
        this.prisma.task.count({ where: { ownerId, status: { not: 'DONE' } } }),
        this.prisma.task.count({
          where: { ownerId, status: { not: 'DONE' }, dueDate: { lt: new Date() } }
        })
      ]);

    const byStatus = Object.fromEntries(CONTACT_STATUSES.map((status) => [status, 0])) as Record<ContactStatus, number>;
    for (const group of contactGroups) {
      byStatus[group.status] = countOf(group._count);
    }

    const byStage = Object.fromEntries(DEAL_STAGES.map((stage) => [stage, 0])) as Record<DealStage, number>;
    for (const group of dealGroups) {
      byStage[group.stage] = countOf(group._count);
    }

    const wonValue = wonAgg._sum.value ?? 0;
    const wonCount = byStage.WON;

    const revenueMap = new Map<string, number>(lastMonthKeys(REVENUE_MONTHS).map((month) => [month, 0]));
    for (const deal of wonDeals) {
      if (!deal.closedAt) continue;
      const key = monthKey(deal.closedAt);
      if (revenueMap.has(key)) {
        revenueMap.set(key, (revenueMap.get(key) ?? 0) + deal.value);
      }
    }
    const revenueByMonth = [...revenueMap.entries()].map(([month, total]) => ({ month, total }));

    const topGroups = [...companyGroups]
      .sort((a, b) => (b._sum?.value ?? 0) - (a._sum?.value ?? 0))
      .slice(0, 5);
    const companyIds = topGroups.map((group) => group.companyId).filter((id): id is string => id !== null);
    const companies = await this.prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, name: true }
    });
    const companyName = new Map(companies.map((company) => [company.id, company.name]));
    const topCompanies = topGroups.map((group) => ({
      companyId: group.companyId,
      name: group.companyId ? companyName.get(group.companyId) ?? 'Unknown' : 'Unassigned',
      pipelineValue: group._sum?.value ?? 0,
      dealCount: countOf(group._count)
    }));

    return {
      contacts: { total: contactTotal, byStatus },
      deals: {
        total: dealTotal,
        byStage,
        pipelineValue: pipelineAgg._sum.value ?? 0,
        wonValue,
        avgDealSize: wonCount > 0 ? wonValue / wonCount : 0
      },
      revenueByMonth,
      topCompanies,
      tasks: { total: taskTotal, open: taskOpen, overdue: taskOverdue }
    };
  }
}
