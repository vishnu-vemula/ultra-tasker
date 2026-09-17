import type { ContactStatus, DealStage } from '@prisma/client';
import type { PrismaService } from '../../database/prisma';

const OPEN_STAGES: DealStage[] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'];
const CONTACT_STATUSES: ContactStatus[] = ['LEAD', 'QUALIFIED', 'CUSTOMER', 'CHURNED'];
const DEAL_STAGES: DealStage[] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

export interface DashboardStats {
  contacts: { total: number; byStatus: Record<ContactStatus, number> };
  deals: { total: number; byStage: Record<DealStage, number>; pipelineValue: number; wonValue: number };
  tasks: { total: number; open: number; overdue: number };
}

export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(ownerId: string): Promise<DashboardStats> {
    const [contactTotal, contactGroups, dealTotal, dealGroups, pipelineAgg, wonAgg, taskTotal, taskOpen, taskOverdue] =
      await this.prisma.$transaction([
        this.prisma.contact.count({ where: { ownerId } }),
        this.prisma.contact.groupBy({ by: ['status'], _count: { _all: true }, where: { ownerId } }),
        this.prisma.deal.count({ where: { ownerId } }),
        this.prisma.deal.groupBy({ by: ['stage'], _count: { _all: true }, where: { ownerId } }),
        this.prisma.deal.aggregate({ _sum: { value: true }, where: { ownerId, stage: { in: OPEN_STAGES } } }),
        this.prisma.deal.aggregate({ _sum: { value: true }, where: { ownerId, stage: 'WON' } }),
        this.prisma.task.count({ where: { ownerId } }),
        this.prisma.task.count({ where: { ownerId, status: { not: 'DONE' } } }),
        this.prisma.task.count({
          where: { ownerId, status: { not: 'DONE' }, dueDate: { lt: new Date() } }
        })
      ]);

    const byStatus = Object.fromEntries(CONTACT_STATUSES.map((status) => [status, 0])) as Record<ContactStatus, number>;
    for (const group of contactGroups) {
      byStatus[group.status] = group._count._all;
    }

    const byStage = Object.fromEntries(DEAL_STAGES.map((stage) => [stage, 0])) as Record<DealStage, number>;
    for (const group of dealGroups) {
      byStage[group.stage] = group._count._all;
    }

    return {
      contacts: { total: contactTotal, byStatus },
      deals: {
        total: dealTotal,
        byStage,
        pipelineValue: pipelineAgg._sum.value ?? 0,
        wonValue: wonAgg._sum.value ?? 0
      },
      tasks: { total: taskTotal, open: taskOpen, overdue: taskOverdue }
    };
  }
}
