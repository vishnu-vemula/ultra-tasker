import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { bootstrapAdminEmails, env } from '../src/config/env';

const prisma = new PrismaClient();

const ownerUid = env.SEED_OWNER_UID ?? 'seed-demo-owner';
const ownerEmail = bootstrapAdminEmails[0] ?? 'demo@ultra-tasker.local';

const days = (n: number): Date => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { id: ownerUid },
    create: { id: ownerUid, email: ownerEmail, displayName: 'Demo Owner', role: 'ADMIN' },
    update: {}
  });

  await prisma.notification.deleteMany({ where: { ownerId: ownerUid } });
  await prisma.auditLog.deleteMany({ where: { userId: ownerUid } });
  await prisma.task.deleteMany({ where: { ownerId: ownerUid } });
  await prisma.activity.deleteMany({ where: { ownerId: ownerUid } });
  await prisma.dealItem.deleteMany({ where: { ownerId: ownerUid } });
  await prisma.deal.deleteMany({ where: { ownerId: ownerUid } });
  await prisma.contact.deleteMany({ where: { ownerId: ownerUid } });
  await prisma.tag.deleteMany({ where: { ownerId: ownerUid } });
  await prisma.product.deleteMany({ where: { ownerId: ownerUid } });
  await prisma.company.deleteMany({ where: { ownerId: ownerUid } });

  const [acme, globex, initech] = await Promise.all([
    prisma.company.create({
      data: {
        name: 'Acme Corp', domain: 'acme.com', industry: 'Manufacturing', phone: '+1 555 0100',
        city: 'Austin', country: 'USA', employeeCount: 450, annualRevenue: 82_000_000,
        notes: 'Long-standing customer. Renewal every January.', ownerId: ownerUid
      }
    }),
    prisma.company.create({
      data: {
        name: 'Globex', domain: 'globex.com', industry: 'Energy', phone: '+1 555 0101',
        city: 'Houston', country: 'USA', employeeCount: 1200, annualRevenue: 640_000_000, ownerId: ownerUid
      }
    }),
    prisma.company.create({
      data: {
        name: 'Initech', domain: 'initech.com', industry: 'Software', city: 'Berlin',
        country: 'Germany', employeeCount: 80, annualRevenue: 12_000_000, ownerId: ownerUid
      }
    })
  ]);

  const tags = {
    hot: await prisma.tag.create({ data: { name: 'Hot', color: '#ef4444', ownerId: ownerUid } }),
    enterprise: await prisma.tag.create({ data: { name: 'Enterprise', color: '#6366f1', ownerId: ownerUid } }),
    smb: await prisma.tag.create({ data: { name: 'SMB', color: '#10b981', ownerId: ownerUid } }),
    strategic: await prisma.tag.create({ data: { name: 'Strategic', color: '#f59e0b', ownerId: ownerUid } })
  };

  const [john, jane, peter, samantha] = await Promise.all([
    prisma.contact.create({
      data: {
        name: 'John Doe', email: 'john@acme.com', phone: '+1 555 0100', position: 'Procurement Lead',
        status: 'CUSTOMER', source: 'REFERRAL', website: 'https://acme.com', city: 'Austin', country: 'USA',
        companyId: acme.id, ownerId: ownerUid, lastActivityAt: days(-2),
        tags: { connect: [{ id: tags.enterprise.id }, { id: tags.strategic.id }] }
      }
    }),
    prisma.contact.create({
      data: {
        name: 'Jane Smith', email: 'jane@globex.com', phone: '+1 555 0101', position: 'CTO',
        status: 'QUALIFIED', source: 'CAMPAIGN', city: 'Houston', country: 'USA',
        companyId: globex.id, ownerId: ownerUid, lastActivityAt: days(-5),
        tags: { connect: [{ id: tags.hot.id }, { id: tags.enterprise.id }] }
      }
    }),
    prisma.contact.create({
      data: {
        name: 'Peter Gibbons', email: 'peter@initech.com', position: 'Engineer',
        status: 'LEAD', source: 'WEBSITE', city: 'Berlin', country: 'Germany',
        companyId: initech.id, ownerId: ownerUid,
        tags: { connect: [{ id: tags.smb.id }] }
      }
    }),
    prisma.contact.create({
      data: {
        name: 'Samantha Wu', email: 'sam@initech.com', position: 'Product Manager',
        status: 'LEAD', source: 'EVENT', city: 'Berlin', country: 'Germany',
        companyId: initech.id, ownerId: ownerUid,
        tags: { connect: [{ id: tags.smb.id }, { id: tags.hot.id }] }
      }
    })
  ]);

  const [core, pro, support] = await Promise.all([
    prisma.product.create({ data: { name: 'Ultra Tasker Core', sku: 'UTC-01', price: 49, currency: 'USD', ownerId: ownerUid } }),
    prisma.product.create({ data: { name: 'Ultra Tasker Pro', sku: 'UTP-02', price: 99, currency: 'USD', ownerId: ownerUid } }),
    prisma.product.create({ data: { name: 'Onboarding & Support', sku: 'SUP-03', price: 1500, currency: 'USD', ownerId: ownerUid } })
  ]);

  const dealData = [
    { title: 'Acme annual license', value: 24000, stage: 'NEGOTIATION' as const, probability: 75, contactId: john.id, companyId: acme.id, expectedCloseDate: days(10), nextStep: 'Send revised MSA', source: 'INBOUND' as const },
    { title: 'Globex pilot program', value: 8500, stage: 'PROPOSAL' as const, probability: 50, contactId: jane.id, companyId: globex.id, expectedCloseDate: days(21), nextStep: 'Technical review call', source: 'OUTBOUND' as const },
    { title: 'Initech migration', value: 42000, stage: 'QUALIFIED' as const, probability: 25, contactId: peter.id, companyId: initech.id, expectedCloseDate: days(45), source: 'REFERRAL' as const },
    { title: 'Analytics add-on', value: 6500, stage: 'NEW' as const, probability: 10, contactId: samantha.id, companyId: initech.id, expectedCloseDate: days(60), source: 'EVENT' as const },
    { title: 'Acme support renewal', value: 12000, stage: 'WON' as const, probability: 100, contactId: john.id, companyId: acme.id, closedAt: days(-5), source: 'INBOUND' as const },
    { title: 'Globex training', value: 3000, stage: 'LOST' as const, probability: 0, contactId: jane.id, companyId: globex.id, closedAt: days(-12), lostReason: 'Went with internal training', source: 'PARTNER' as const }
  ];
  const deals = [];
  for (const [index, deal] of dealData.entries()) {
    deals.push(
      await prisma.deal.create({
        data: { ...deal, currency: 'USD', position: index + 1, ownerId: ownerUid, tags: { connect: index % 2 === 0 ? [{ id: tags.enterprise.id }] : [{ id: tags.smb.id }] } }
      })
    );
  }

  await prisma.dealItem.createMany({
    data: [
      { dealId: deals[0]!.id, ownerId: ownerUid, productId: pro.id, description: 'Ultra Tasker Pro ×20 seats', quantity: 20, unitPrice: 99 },
      { dealId: deals[0]!.id, ownerId: ownerUid, productId: support.id, description: 'Onboarding package', quantity: 1, unitPrice: 4200 },
      { dealId: deals[1]!.id, ownerId: ownerUid, productId: core.id, description: 'Core pilot ×10 seats', quantity: 10, unitPrice: 49 }
    ]
  });

  const activities = [
    { type: 'CALL' as const, title: 'Discovery call', body: 'Discussed procurement timeline and budget approval process.', occurredAt: days(-3), durationMin: 30, contactId: john.id, dealId: deals[0]!.id, companyId: acme.id },
    { type: 'EMAIL' as const, title: 'Sent pilot proposal', body: 'Proposal attached, awaiting technical review.', occurredAt: days(-4), durationMin: null, contactId: jane.id, dealId: deals[1]!.id, companyId: globex.id },
    { type: 'MEETING' as const, title: 'Migration workshop', body: 'Mapped their existing workflow; strong fit for migration service.', occurredAt: days(-7), durationMin: 90, contactId: peter.id, dealId: deals[2]!.id, companyId: initech.id },
    { type: 'NOTE' as const, title: 'Churn risk resolved', body: 'Renewal signed after support SLA adjustment.', occurredAt: days(-5), durationMin: null, contactId: john.id, companyId: acme.id },
    { type: 'CALL' as const, title: 'Intro to analytics', body: 'Samantha interested in add-on, demo scheduled.', occurredAt: days(-6), durationMin: 15, contactId: samantha.id, dealId: deals[3]!.id }
  ];
  for (const activity of activities) {
    await prisma.activity.create({ data: { ...activity, ownerId: ownerUid } });
  }

  const tasks = [
    { title: 'Send revised contract to John', dueDate: days(2), status: 'TODO' as const, priority: 'HIGH' as const, contactId: john.id, dealId: deals[0]!.id },
    { title: 'Prepare Globex pilot success metrics', dueDate: days(5), status: 'IN_PROGRESS' as const, priority: 'MEDIUM' as const, contactId: jane.id, dealId: deals[1]!.id },
    { title: 'Discovery call with Initech team', dueDate: days(-1), status: 'TODO' as const, priority: 'URGENT' as const, contactId: peter.id, dealId: deals[2]!.id },
    { title: 'Demo analytics add-on for Samantha', dueDate: days(7), status: 'TODO' as const, priority: 'LOW' as const, contactId: samantha.id, dealId: deals[3]!.id },
    { title: 'Invoice Acme for renewal', dueDate: days(-3), status: 'DONE' as const, priority: 'MEDIUM' as const, contactId: john.id }
  ];
  for (const task of tasks) {
    await prisma.task.create({ data: { ...task, ownerId: ownerUid, completedAt: task.status === 'DONE' ? days(-3) : null } });
  }

  console.log(
    `Seed complete: 3 companies, 4 contacts, ${Object.keys(tags).length} tags, ${deals.length} deals (3 with line items), 3 products, ${activities.length} activities, ${tasks.length} tasks (owner ${ownerUid})`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
