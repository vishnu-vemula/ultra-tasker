import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../database/prisma';

const taskInclude = { contact: { select: { id: true, name: true } }, deal: { select: { id: true, title: true } } } as const;

export type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

export interface ListTasksInput {
  ownerId: string;
  status?: string;
  contactId?: string;
  dealId?: string;
  page: number;
  pageSize: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  status?: Prisma.TaskCreateInput['status'];
  priority?: Prisma.TaskCreateInput['priority'];
  contactId?: string | null;
  dealId?: string | null;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export interface ITasksRepository {
  list(input: ListTasksInput): Promise<{ items: TaskWithRelations[]; total: number }>;
  findByIdAndOwner(id: string, ownerId: string): Promise<TaskWithRelations | null>;
  relationOwnedByOwner(kind: 'contact' | 'deal', id: string, ownerId: string): Promise<boolean>;
  create(ownerId: string, input: CreateTaskInput): Promise<TaskWithRelations>;
  update(id: string, ownerId: string, input: UpdateTaskInput): Promise<TaskWithRelations>;
  delete(id: string, ownerId: string): Promise<void>;
}

type TaskStatusValue = 'TODO' | 'IN_PROGRESS' | 'DONE';

export class TasksRepository implements ITasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(input: ListTasksInput): Prisma.TaskWhereInput {
    const where: Prisma.TaskWhereInput = { ownerId: input.ownerId };
    if (input.status) where.status = input.status as TaskStatusValue;
    if (input.contactId) where.contactId = input.contactId;
    if (input.dealId) where.dealId = input.dealId;
    return where;
  }

  async list(input: ListTasksInput): Promise<{ items: TaskWithRelations[]; total: number }> {
    const where = this.buildWhere(input);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        include: taskInclude,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize
      }),
      this.prisma.task.count({ where })
    ]);
    return { items, total };
  }

  findByIdAndOwner(id: string, ownerId: string): Promise<TaskWithRelations | null> {
    return this.prisma.task.findFirst({ where: { id, ownerId }, include: taskInclude });
  }

  relationOwnedByOwner(kind: 'contact' | 'deal', id: string, ownerId: string): Promise<boolean> {
    if (kind === 'contact') {
      return this.prisma.contact.findFirst({ where: { id, ownerId }, select: { id: true } }).then((r) => r !== null);
    }
    return this.prisma.deal.findFirst({ where: { id, ownerId }, select: { id: true } }).then((r) => r !== null);
  }

  create(ownerId: string, input: CreateTaskInput): Promise<TaskWithRelations> {
    return this.prisma.task.create({
      data: {
        ownerId,
        title: input.title,
        description: input.description ?? null,
        dueDate: input.dueDate ?? null,
        status: input.status ?? 'TODO',
        priority: input.priority ?? null,
        contactId: input.contactId ?? null,
        dealId: input.dealId ?? null,
        completedAt: input.status === 'DONE' ? new Date() : null
      },
      include: taskInclude
    });
  }

  update(id: string, ownerId: string, input: UpdateTaskInput): Promise<TaskWithRelations> {
    return this.prisma.task.update({
      where: { id_ownerId: { id, ownerId } },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.contactId !== undefined && { contactId: input.contactId }),
        ...(input.dealId !== undefined && { dealId: input.dealId }),
        ...(input.status === 'DONE' ? { completedAt: new Date() } : {}),
        ...(input.status !== undefined && input.status !== 'DONE' ? { completedAt: null } : {})
      },
      include: taskInclude
    });
  }

  async delete(id: string, ownerId: string): Promise<void> {
    await this.prisma.task.delete({ where: { id_ownerId: { id, ownerId } } });
  }
}
