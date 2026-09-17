# Ultra Tasker

A production-grade CRM built on a typed, feature-based stack: **contacts, companies, a drag-and-drop deal pipeline, tasks/activities, a KPI dashboard, and role-based user management** — with Firebase Authentication and Prisma + PostgreSQL.

> Formerly a MERN task-manager demo. Fully rebuilt: TypeScript everywhere, Prisma ORM behind repositories, dependency-injected services, Zod-validated boundaries, and a three-layer frontend data architecture (`api/` → `hooks/` → `components/`).

## Features

- **Auth** — Firebase Authentication (email/password + Google OAuth); the API verifies Bearer ID tokens on every request
- **Contacts** — CRUD with statuses (Lead / Qualified / Customer / Churned), company links, search + pagination
- **Companies** — CRUD with domain + industry
- **Deal pipeline** — Kanban board across New → Qualified → Proposal → Negotiation → Won/Lost with drag-and-drop, persisted ordering, multi-currency values, close dates
- **Tasks** — activities linked to contacts/deals, priorities, due dates, overdue tracking, quick-complete
- **Dashboard** — pipeline value, won value, contact breakdown, stage distribution, task health
- **User management** — ADMIN role (bootstrapped via env list) can view users and change roles (stored as Firebase custom claims)
- **Production hygiene** — Helmet, CORS allow-list, rate limiting, compression, Pino structured logs, request validation, error envelope, graceful shutdown

## Architecture

| Layer | Stack |
|-------|-------|
| Backend | Node 18+, Express, TypeScript (strict), Zod |
| Data | PostgreSQL + Prisma ORM behind repository classes |
| Auth | Firebase Admin (token verification, custom claims) |
| DI | Constructor injection wired in a single composition root (`backend/src/container.ts`) |
| Frontend | React 18 + Vite + TypeScript, Tailwind CSS |
| Client data | `features/*/api` (pure fetch functions) → `features/*/hooks` (React Query) → `components` (render only) |
| DnD | @hello-pangea/dnd (maintained react-beautiful-dnd fork) |

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

> The seed assigns data to `SEED_OWNER_UID` (defaults to a placeholder). For the data to be visible to your account, sign in once, grab your Firebase UID (Settings → Users in Firebase console), put it in `.env` as `SEED_OWNER_UID`, and re-run the seed.

### 3. Frontend

```bash
cd frontend
cp .env.example .env    # paste your Firebase web-app config
npm install
npm run dev             # app on http://localhost:5173
```

### 4. First login

Sign up in the app with an email listed in `BOOTSTRAP_ADMIN_EMAILS` — you'll get the ADMIN role and access to user management.

## Scripts

| Command | Where | Description |
| ------- | ----- | ----------- |
| `npm run dev` | `backend` | Dev server with watch (port 4000) |
| `npm run build` / `npm start` | `backend` | Compile / run production build |
| `npm run typecheck` | both | `tsc --noEmit` |
| `npm run lint` | both | ESLint |
| `npm test` | `backend` | Vitest unit tests |
| `npx prisma migrate dev` | `backend` | Apply schema changes |
| `npm run db:seed` | `backend` | Demo data |
| `npm run db:studio` | `backend` | Prisma Studio |
| `npm run dev` / `build` / `lint` / `typecheck` | `frontend` | Vite app |

## API Overview

Base URL: `/api/v1` · Auth: `Authorization: Bearer <Firebase ID token>` on every route · Envelope: `{ "data": ... }` / `{ "error": { "code", "message" } }`

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/health` | Liveness (no auth) |
| POST | `/auth/session` | Sync profile, returns current user |
| GET / PATCH | `/users`, `/users/:id/role` | List users / change role (ADMIN) |
| GET / POST / PATCH / DELETE | `/contacts[/:id]` | Contacts CRUD (search, status, pagination) |
| GET / POST / PATCH / DELETE | `/companies[/:id]` | Companies CRUD |
| GET / POST / PATCH / DELETE | `/deals[/:id]` | Deals CRUD |
| PATCH | `/deals/reorder` | Kanban reorder (batch stage + position) |
| GET / POST / PATCH / DELETE | `/tasks[/:id]` | Tasks CRUD |
| GET | `/dashboard/stats` | Dashboard aggregates |

## Project Structure

```
├── AGENTS.md / SKILLS.md / ARCHITECTURE.md   # engineering harness + architecture laws
├── backend/
│   ├── prisma/            # schema.prisma, migrations, seed
│   └── src/
│       ├── config/        # Zod-validated env
│       ├── common/        # middleware (auth, errors), utils
│       ├── database/      # Prisma + Firebase Admin singletons
│       ├── features/      # auth, users, contacts, companies, deals, tasks, dashboard
│       │   └── <name>/    # router → controller → service → repository + schemas
│       ├── container.ts   # DI composition root
│       └── app.ts / main.ts
└── frontend/
    └── src/
        ├── features/<name>/   # api/ (pure fetch) → hooks/ (React Query) → components/
        └── shared/            # api-client, UI primitives, types
```

## Roadmap

- [ ] CI (typecheck + lint + test on push)
- [ ] Playwright smoke tests
- [ ] CSV import/export for contacts
- [ ] Activity timeline per contact
- [ ] Email reminders for overdue tasks

## Contributing

Contributions welcome — read [`AGENTS.md`](AGENTS.md) first; the architecture laws apply to every PR.

## Author

Vishnu Vardhan Vemula — [GitHub](https://github.com/vishnu-vemula)
