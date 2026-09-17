import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { bootstrapAdminEmails, env } from '../src/config/env';

const prisma = new PrismaClient();

const ownerUid = env.SEED_OWNER_UID ?? 'seed-demo-owner';
const ownerEmail = bootstrapAdminEmails[0] ?? 'demo@ultra-tasker.local';

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { id: ownerUid },
    create: { id: ownerUid, email: ownerEmail, displayName: 'Demo Owner', role: 'ADMIN' },
    update: {}
  });

  await prisma.task.deleteMany({ where: { ownerId: ownerUid } });
  await prisma.deal.deleteMany({ where: { ownerId: ownerUid } });
  await prisma.contact.deleteMany({ where: { ownerId: ownerUid } });
  await prisma.company.deleteMany({ where: { ownerId: ownerUid } });

  const [acme, globex, initech] = await Promise.all([
    prisma.company.create({ data: { name: 'Acme Corp', domain: 'acme.com', industry: 'Manufacturing', ownerId: ownerUid } }),
    prisma.company.create({ data: { name: 'Globex', domain: 'globex.com', industry: 'Energy', ownerId: ownerUid } }),
    prisma.company.create({ data: { name: 'Initech', domain: 'initech.com', industry: 'Software', ownerId: ownerUid } })
  ]);

  const john = await prisma.contact.create({
    data: { name: 'John Doe', email: 'john@acme.com', phone: '+1 555 0100', position: 'Procurement Lead', status: 'CUSTOMER', companyId: acme.id, ownerId: ownerUid }
  });
  const jane = await prisma.contact.create({
    data: { name: 'Jane Smith', email: 'jane@globex.com', phone: '+1 555 0101', position: 'CTO', status: 'QUALIFIED', companyId: globex.id, ownerId: ownerUid }
  });
  const peter = await prisma.contact.create({
    data: { name: 'Peter Gibbons', email: 'peter@initech.com', position: 'Engineer', status: 'LEAD', companyId: initech.id, ownerId: ownerUid }
  });
  const samantha = await prisma.contact.create({
    data: { name: 'Samantha Wu', email: 'sam@initech.com', position: 'Product Manager', status: 'LEAD', companyId: initech.id, ownerId: ownerUid }
  });

  const days = (n: number): Date => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

  const deals = [
    { title: 'Acme annual license', value: 24000, stage: 'NEGOTIATION' as const, position: 1, contactId: john.id, companyId: acme.id, expectedCloseDate: days(10) },
    { title: 'Globex pilot program', value: 8500, stage: 'PROPOSAL' as const, position: 1, contactId: jane.id, companyId: globex.id, expectedCloseDate: days(21) },
    { title: 'Initech migration', value: 42000, stage: 'QUALIFIED' as const, position: 1, contactId: peter.id, companyId: initech.id, expectedCloseDate: days(45) },
    { title: 'Analytics add-on', value: 6500, stage: 'NEW' as const, position: 1, contactId: samantha.id, companyId: initech.id, expectedCloseDate: days(60) },
    { title: 'Acme support renewal', value: 12000, stage: 'WON' as const, position: 1, contactId: john.id, companyId: acme.id, closedAt: days(-5) },
    { title: 'Globex training', value: 3000, stage: 'LOST' as const, position: 1, contactId: jane.id, companyId: globex.id, closedAt: days(-12) }
  ];
  const createdDeals = [];
  for (const deal of deals) {
    createdDeals.push(await prisma.deal.create({ data: { ...deal, currency: 'USD', ownerId: ownerUid } }));
  }

  const tasks = [
    { title: 'Send revised contract to John', dueDate: days(2), status: 'TODO' as const, priority: 'HIGH' as const, contactId: john.id },
    { title: 'Prepare Globex pilot success metrics', dueDate: days(5), status: 'IN_PROGRESS' as const, priority: 'MEDIUM' as const, contactId: jane.id },
    { title: 'Discovery call with Initech team', dueDate: days(-1), status: 'TODO' as const, priority: 'URGENT' as const, contactId: peter.id },
    { title: 'Demo analytics add-on for Samantha', dueDate: days(7), status: 'TODO' as const, priority: 'LOW' as const, dealId: createdDeals[3]?.id },
    { title: 'Invoice Acme for renewal', dueDate: days(-3), status: 'DONE' as const, priority: 'MEDIUM' as const, contactId: john.id }
  ];
  for (const task of tasks) {
    await prisma.task.create({ data: { ...task, ownerId: ownerUid } });
  }

  console.log(`Seed complete: 3 companies, 4 contacts, ${createdDeals.length} deals, ${tasks.length} tasks (owner ${ownerUid})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
