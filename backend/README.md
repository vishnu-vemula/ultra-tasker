# Ultra Tasker — Backend

Express + TypeScript + Prisma (PostgreSQL) + Firebase Auth CRM API.

See the root [README](../README.md) for setup, and [AGENTS.md](../AGENTS.md) / [ARCHITECTURE.md](../ARCHITECTURE.md) for engineering conventions.

```bash
cp .env.example .env   # fill in DATABASE_URL + Firebase credentials
npm install
npx prisma migrate dev
npm run db:seed        # optional demo data
npm run dev
```
