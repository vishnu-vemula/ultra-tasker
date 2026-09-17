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
import { TagsRepository } from './features/tags/tags.repository';
import { TagsService } from './features/tags/tags.service';
import { TagsController } from './features/tags/tags.controller';
import { buildTagsRouter } from './features/tags/tags.router';
import { ProductsRepository } from './features/products/products.repository';
import { ProductsService } from './features/products/products.service';
import { ProductsController } from './features/products/products.controller';
import { buildProductsRouter } from './features/products/products.router';
import { ActivitiesRepository } from './features/activities/activities.repository';
import { ActivitiesService } from './features/activities/activities.service';
import { ActivitiesController } from './features/activities/activities.controller';
import { buildActivitiesRouter } from './features/activities/activities.router';
import { NotificationsRepository } from './features/notifications/notifications.repository';
import { NotificationsService } from './features/notifications/notifications.service';
import { NotificationsController } from './features/notifications/notifications.controller';
import { buildNotificationsRouter } from './features/notifications/notifications.router';
import { AuditRepository } from './features/audit/audit.repository';
import { AuditService } from './features/audit/audit.service';
import { AuditController } from './features/audit/audit.controller';
import { buildAuditRouter } from './features/audit/audit.router';
import { SearchRepository } from './features/search/search.repository';
import { SearchService } from './features/search/search.service';
import { SearchController } from './features/search/search.controller';
import { buildSearchRouter } from './features/search/search.router';
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
    tags: Router;
    products: Router;
    activities: Router;
    notifications: Router;
    audit: Router;
    search: Router;
    dashboard: Router;
  };
}

export function createContainer(): Container {
  const prisma = createPrismaService();

  const auditRepository = new AuditRepository(prisma);
  const auditService = new AuditService(auditRepository);

  const usersRepository = new UsersRepository(prisma);
  const usersService = new UsersService(usersRepository);

  const companiesRepository = new CompaniesRepository(prisma);
  const companiesService = new CompaniesService(companiesRepository, auditService);

  const tagsRepository = new TagsRepository(prisma);
  const tagsService = new TagsService(tagsRepository, auditService);

  const contactsRepository = new ContactsRepository(prisma);
  const contactsService = new ContactsService(
    contactsRepository,
    { companyOwnedByOwner: (companyId, ownerId) => companiesRepository.companyOwnedByOwner(companyId, ownerId) },
    tagsService,
    auditService
  );

  const tasksRepository = new TasksRepository(prisma);
  const tasksService = new TasksService(tasksRepository, auditService);

  const notificationsRepository = new NotificationsRepository(prisma);
  const notificationsService = new NotificationsService(notificationsRepository, {
    findOverdue: (ownerId) => tasksRepository.findOverdue(ownerId)
  });

  const dealsRepository = new DealsRepository(prisma);
  const dealsService = new DealsService(dealsRepository, auditService, notificationsService, tagsService);

  const productsRepository = new ProductsRepository(prisma);
  const productsService = new ProductsService(productsRepository, auditService);

  const activitiesRepository = new ActivitiesRepository(prisma);
  const activitiesService = new ActivitiesService(activitiesRepository, auditService);

  const authService = new AuthService(usersService);
  const dashboardService = new DashboardService(prisma);

  const searchRepository = new SearchRepository(prisma);
  const searchService = new SearchService(searchRepository);

  const authMiddleware = new AuthMiddleware(usersService);

  const authController = new AuthController(authService);
  const usersController = new UsersController(usersService);
  const contactsController = new ContactsController(contactsService);
  const companiesController = new CompaniesController(companiesService);
  const dealsController = new DealsController(dealsService);
  const tasksController = new TasksController(tasksService);
  const tagsController = new TagsController(tagsService);
  const productsController = new ProductsController(productsService);
  const activitiesController = new ActivitiesController(activitiesService);
  const notificationsController = new NotificationsController(notificationsService);
  const auditController = new AuditController(auditService);
  const searchController = new SearchController(searchService);
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
      tags: buildTagsRouter(tagsController, authMiddleware),
      products: buildProductsRouter(productsController, authMiddleware),
      activities: buildActivitiesRouter(activitiesController, authMiddleware),
      notifications: buildNotificationsRouter(notificationsController, authMiddleware),
      audit: buildAuditRouter(auditController, authMiddleware),
      search: buildSearchRouter(searchController, authMiddleware),
      dashboard: buildDashboardRouter(dashboardController, authMiddleware)
    }
  };
}
