import { CompaniesRepository } from './features/companies/companies.repository';
import { CompaniesService } from './features/companies/companies.service';
import { ContactsRepository } from './features/contacts/contacts.repository';
import { ContactsService } from './features/contacts/contacts.service';
import { DealsRepository } from './features/deals/deals.repository';
import { DealsService } from './features/deals/deals.service';
import { TasksRepository } from './features/tasks/tasks.repository';
import { TasksService } from './features/tasks/tasks.service';
import { UsersRepository } from './features/users/users.repository';
import { UsersService } from './features/users/users.service';
import { AuthService } from './features/auth/auth.service';
import { AuthController } from './features/auth/auth.controller';
import { buildAuthRouter } from './features/auth/auth.router';
import { UsersController } from './features/users/users.controller';
import { buildUsersRouter } from './features/users/users.router';
import { ContactsController } from './features/contacts/contacts.controller';
import { buildContactsRouter } from './features/contacts/contacts.router';
import { CompaniesController } from './features/companies/companies.controller';
import { buildCompaniesRouter } from './features/companies/companies.router';
import { DealsController } from './features/deals/deals.controller';
import { buildDealsRouter } from './features/deals/deals.router';
import { TasksController } from './features/tasks/tasks.controller';
import { buildTasksRouter } from './features/tasks/tasks.router';
import { DashboardService } from './features/dashboard/dashboard.service';
import { DashboardController } from './features/dashboard/dashboard.controller';
import { buildDashboardRouter } from './features/dashboard/dashboard.router';
import { AuthMiddleware } from './common/middleware/auth.middleware';
import { createPrismaService, type PrismaService } from './database/prisma';
import type { Router } from 'express';

export interface Container {
  prisma: PrismaService;
  routers: {
    auth: Router;
    users: Router;
    contacts: Router;
    companies: Router;
    deals: Router;
    tasks: Router;
    dashboard: Router;
  };
}

export function createContainer(): Container {
  const prisma = createPrismaService();

  const usersRepository = new UsersRepository(prisma);
  const usersService = new UsersService(usersRepository);

  const companiesRepository = new CompaniesRepository(prisma);
  const companiesService = new CompaniesService(companiesRepository);

  const contactsRepository = new ContactsRepository(prisma);
  const contactsService = new ContactsService(contactsRepository, {
    companyOwnedByOwner: (companyId, ownerId) => companiesRepository.companyOwnedByOwner(companyId, ownerId)
  });

  const dealsRepository = new DealsRepository(prisma);
  const dealsService = new DealsService(dealsRepository);

  const tasksRepository = new TasksRepository(prisma);
  const tasksService = new TasksService(tasksRepository);

  const authService = new AuthService(usersService);
  const dashboardService = new DashboardService(prisma);

  const authMiddleware = new AuthMiddleware(usersService);

  const authController = new AuthController(authService);
  const usersController = new UsersController(usersService);
  const contactsController = new ContactsController(contactsService);
  const companiesController = new CompaniesController(companiesService);
  const dealsController = new DealsController(dealsService);
  const tasksController = new TasksController(tasksService);
  const dashboardController = new DashboardController(dashboardService);

  return {
    prisma,
    routers: {
      auth: buildAuthRouter(authController, authMiddleware),
      users: buildUsersRouter(usersController, authMiddleware),
      contacts: buildContactsRouter(contactsController, authMiddleware),
      companies: buildCompaniesRouter(companiesController, authMiddleware),
      deals: buildDealsRouter(dealsController, authMiddleware),
      tasks: buildTasksRouter(tasksController, authMiddleware),
      dashboard: buildDashboardRouter(dashboardController, authMiddleware)
    }
  };
}
