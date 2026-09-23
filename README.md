# Ultra Tasker

![Ultra Tasker](images/banner.svg)

A production-grade CRM built on a typed, feature-based stack: **contacts, companies, a drag-and-drop deal pipeline with quote builder, tasks, activity timelines, tags, notifications, an audit trail, and a KPI dashboard** — with Firebase Authentication and Prisma + PostgreSQL.

> Formerly a MERN task-manager demo. Fully rebuilt: TypeScript everywhere, Prisma ORM behind repositories, dependency-injected services, Zod-validated boundaries, and a three-layer frontend data architecture (`api/` → `hooks/` → `components/`).

## Screenshots

**Legacy UI (v1 task manager — new CRM screenshots coming after next deploy):**

<details>
<summary>View v1 screenshots</summary>

| | |
|---|---|
| ![Login](images/login.png) | ![Signup](images/signup.png) |
| ![Task Board](images/home.png) | ![Task Details](images/taskdetails.png) |
| ![Edit Task](images/taskedit.png) | |

</details>

## Features

- **Auth** — Firebase Authentication (email/password + Google OAuth); the API verifies Bearer ID tokens on every request; ADMIN/MEMBER roles via custom claims
- **Contacts** — CRUD with statuses, sources, company links, tags, search + pagination, CSV export
- **Companies** — profiles with industry, size, revenue; detail view with contacts and deals
- **Deal pipeline** — Kanban across New → Qualified → Proposal → Negotiation → Won/Lost with drag-and-drop, persisted ordering, probabilities, close dates, lost reasons
- **Quote builder** — product catalog and deal line items; deal value auto-recalculates from its items
- **Activities** — notes, calls, emails, meetings on a timeline per contact/deal; contacts track last-touch time
- **Tags** — colored tags on contacts and deals, managed in Settings
- **Tasks** — activities linked to contacts/deals, priorities, due dates, overdue tracking, quick-complete
- **Notifications** — in-app bell with unread count; deal-won alerts and overdue-task reminders (deduped)
- **Audit trail** — every create/update/delete/stage-change recorded per record, visible on detail pages
- **Global search** — one box across contacts, companies and deals
- **Dashboard** — pipeline value, won value, avg deal size, 6-month revenue trend, stage distribution, top companies, task health
- **User management** — ADMINs can list users and change roles
- **Production hygiene** — Helmet, CORS allow-list, rate limiting, compression, Pino structured logs, validation, error envelope, graceful shutdown

## Architecture

![Architecture](images/architecture.svg)

| Layer | Stack |
|-------|-------|
| Backend | Node 18+, Express, TypeScript (strict), Zod |
| Data | PostgreSQL + Prisma ORM behind repository classes |
| Auth | Firebase Admin (token verification, custom claims) |
| DI | Constructor injection wired in a single composition root (`backend/src/container.ts`) |
| Frontend | Next.js 14 (App Router) + React 18 + TypeScript, Tailwind CSS |
| Client data | `features/*/api` (pure fetch functions) → `features/*/hooks` (React Query) → `components` (render only) |
| DnD | @hello-pangea/dnd (maintained react-beautiful-dnd fork) |

### Domain model map

```
User (Firebase UID, role)
 ├── Company  ──< Contact ──< Deal >── Company
 │                │  └──< Task >──────┘
 │                ├──< Activity (NOTE/CALL/EMAIL/MEETING, also on Deal/Company)
 │                └──< Tag (M2M, also on Deal)
 ├── Product ──< DealItem >── Deal          ← quote builder, value = Σ(qty × unit price)
 └── Notification (TASK_OVERDUE / DEAL_WON, deduped)

AuditLog (CREATE/UPDATE/DELETE/STAGE_CHANGE per entity, owner-scoped)
```

Every record is scoped by `ownerId` — users only ever see their own CRM data. Full rules: [`ARCHITECTURE.md`](ARCHITECTURE.md). Agent workflows: [`AGENTS.md`](AGENTS.md) and [`SKILLS.md`](SKILLS.md).

## Getting Started

### Prerequisites

- Node.js 18.18+
- PostgreSQL (local, Docker, or free tier on [Neon](https://neon.tech) / [Supabase](https://supabase.com))
- A Firebase project (free)

### 1. Firebase setup (~5 minutes)

1. Create a project at https://console.firebase.google.com
2. **Authentication → Sign-in method**: enable *Email/Password* and *Google*
3. **Project settings → Service accounts → Generate new private key** — download the JSON
4. **Project settings → General → Your apps → Web app** — copy the config values (`apiKey`, `authDomain`, etc.)

### 2. Backend

```bash
cd backend
cp .env.example .env    # fill in DATABASE_URL + Firebase values below
npm install
npx prisma migrate dev  # creates schema
npm run dev             # API on http://localhost:4000
```

In `backend/.env`:

- `DATABASE_URL` — your Postgres connection string (add `?sslmode=require` for Neon/Supabase)
- Firebase credentials — either paste the whole service-account JSON into `FIREBASE_SERVICE_ACCOUNT_KEY` (single line), or fill `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` (keep the `\n` escapes)
- `BOOTSTRAP_ADMIN_EMAILS` — comma-separated; these emails get ADMIN on first login

Optional demo data:

```bash
npm run db:seed
```

> The seed assigns data to `SEED_OWNER_UID` (defaults to a placeholder). For the data to be visible to your account, sign in once, grab your Firebase UID, put it in `.env` as `SEED_OWNER_UID`, and re-run the seed.

### 3. Frontend

```bash
cd frontend
cp .env.example .env    # paste your Firebase web-app config
npm install
npm run dev             # app on http://localhost:3000
```

> The frontend runs on port 3000 — make sure `CORS_ORIGIN` in `backend/.env` includes `http://localhost:3000`.

### 4. First login

Sign up in the app with an email listed in `BOOTSTRAP_ADMIN_EMAILS` — you'll get the ADMIN role and access to user management.

## Scripts

| Command | Where | Description |
| ------- | ----- | ----------- |
| `npm run dev` | `backend` | Dev server with watch (port 4000) |
| `npm run build` / `npm start` | `backend` | Compile / run production build |
| `npm run typecheck` | both | `tsc --noEmit` |
| `npm run lint` | both | ESLint |
| `npm test` | `backend` | Vitest unit tests (no DB needed) |
| `npm run test:e2e` | `backend` | End-to-end API tests — needs a scratch Postgres: `docker run -d --name ultra-tasker-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ultra_tasker -p 5434:5432 postgres:16-alpine` then `npx prisma migrate dev` |
| `npx prisma migrate dev` | `backend` | Apply schema changes |
| `npm run db:seed` | `backend` | Demo data |
| `npm run db:studio` | `backend` | Prisma Studio |
| `npm run dev` / `build` / `start` / `lint` / `typecheck` | `frontend` | Next.js app |

## API Overview

Base URL: `/api/v1` · Auth: `Authorization: Bearer <Firebase ID token>` on every route · Envelope: `{ "data": ... }` / `{ "error": { "code", "message" } }`

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/health` | Liveness (no auth) |
| POST | `/auth/session` | Sync profile, returns current user |
| GET / PATCH | `/users`, `/users/:id/role` | List users / change role (ADMIN) |
| GET / POST / PATCH / DELETE | `/contacts[/:id]` | Contacts CRUD (search, status, pagination) |
| GET | `/contacts/export` | CSV download |
| PATCH | `/contacts/:id/tags` | Replace contact tags |
| GET / POST / PATCH / DELETE | `/companies[/:id]` | Companies CRUD |
| GET / POST / PATCH / DELETE | `/deals[/:id]` | Deals CRUD (stage changes trigger close/probability logic) |
| PATCH | `/deals/reorder` | Kanban reorder (batch stage + position) |
| PATCH | `/deals/:id/tags` | Replace deal tags |
| POST / PATCH / DELETE | `/deals/:id/items[/:itemId]` | Quote line items (auto-recalc deal value) |
| GET / POST / PATCH / DELETE | `/tasks[/:id]` | Tasks CRUD |
| GET / POST / PATCH / DELETE | `/tags[/:id]` | Tag CRUD |
| GET / POST / PATCH / DELETE | `/products[/:id]` | Product catalog CRUD |
| GET / POST / PATCH / DELETE | `/activities[/:id]` | Activity timeline CRUD |
| GET | `/notifications` | List + unread count (syncs overdue-task alerts) |
| POST | `/notifications/read` | Mark read (ids or all) |
| GET | `/search?q=` | Global search |
| GET | `/audit?entityType=&entityId=` | Audit trail for a record |
| GET | `/dashboard/stats` | Dashboard aggregates |

## Project Structure

```
├── AGENTS.md / SKILLS.md / ARCHITECTURE.md   # engineering harness + architecture laws
├── backend/
│   ├── prisma/            # schema.prisma, migrations, seed
│   └── src/
│       ├── config/        # Zod-validated env
│       ├── common/        # middleware (auth, errors), utils, audit/notification ports
│       ├── database/      # Prisma + Firebase Admin singletons
│       ├── features/      # auth, users, contacts, companies, deals, tasks,
│       │                  # tags, products, activities, notifications, audit, search, dashboard
│       │   └── <name>/    # router → controller → service → repository + schemas
│       ├── container.ts   # DI composition root
│       └── app.ts / main.ts
└── frontend/
    ├── app/                 # App Router: layouts, route groups, thin page.tsx views
    │   ├── (auth)/          # /login, /signup (public)
    │   └── (crm)/           # auth-guarded shell: /, /contacts, /deals, /tasks, /settings/*
    └── src/
        ├── features/<name>/ # api/ (pure fetch, .ts) → hooks/ (React Query, .ts) → components/ (.tsx)
        └── shared/          # api-client, firebase, UI primitives, audit timeline, types
```

## Roadmap

- [ ] CI (typecheck + lint + test on push)
- [ ] Playwright smoke tests
- [ ] CSV import (export is live)
- [ ] Email reminders for overdue tasks
- [ ] Multiple pipelines per workspace

## Contributing

Contributions welcome — read [`AGENTS.md`](AGENTS.md) first; the architecture laws apply to every PR.

## Author

Vishnu Vardhan Vemula — [GitHub](https://github.com/vishnu-vemula)
