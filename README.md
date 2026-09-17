# TaskForge

A full-stack task management app — organize work across **To Do / In Progress / Done** Kanban columns with drag-and-drop, secure JWT cookie auth, and Google OAuth.

> Formerly *Task-Manager / ultra-tasker*. Now on a guided migration to a TypeScript, feature-based architecture (see [Architecture](#architecture)).

**Live demo:** https://taskmanger-4sy5.onrender.com (Render free tier — cold starts are slow, give it ~30s)

## Screenshots

| | |
|---|---|
| ![Login](images/login.png) | ![Signup](images/signup.png) |
| ![Task Board](images/home.png) | ![Task Details](images/taskdetails.png) |
| ![Edit Task](images/taskedit.png) | |

## Features

- **Auth** — register / login / logout with JWT in HttpOnly cookies + Google OAuth
- **Task CRUD** — create, search, update, delete; due dates, priorities, assignment
- **Kanban board** — drag-and-drop between To Do / In Progress / Done with persisted order
- **Optimistic updates** — React Query caching with rollback for instant UI
- **Protected routes** — authentication-based routing
- **Responsive UI** — Tailwind CSS

## Architecture

TaskForge is **mid-migration**: the running app is the legacy MERN codebase; the target is a feature-based, ORM-backed, dependency-injected TypeScript stack. Full blueprint and laws in [`ARCHITECTURE.md`](ARCHITECTURE.md); agent workflows in [`AGENTS.md`](AGENTS.md) and [`SKILLS.md`](SKILLS.md).

| Layer | Now | Target |
|-------|-----|--------|
| Backend | Express (JS) + Mongoose | NestJS + TypeScript, DI, class-validator |
| Data | Mongoose calls in controllers | Prisma ORM behind repositories |
| Frontend | React + Vite SPA (JS) | Next.js App Router (TS), BFF route handlers |
| Data fetching | hooks + axios in `helper.js` | `api/` pure functions → `hooks/` (React Query) → `components/` |

**Core laws** (enforced in review):

1. Feature-based folders — `features/<name>` owns everything for a feature
2. ORM only, behind repositories — controllers never touch the DB
3. Dependency injection — services receive collaborators via constructor
4. TypeScript strict, validate at every boundary (DTO/Zod)
5. Data fetching is separate from UI — components never call `fetch`/`axios`

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- A Firebase project (for Google OAuth)

### 1. Clone

```bash
git clone https://github.com/vishnu-vemula/TaskForge.git
cd TaskForge
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
COOKIE_SECRET=your_cookie_secret
FRONTEND_BASE_URL=http://localhost:5173
```

```bash
npm start   # API on http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_BACKEND_BASE_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=your_firebase_api_key
```

```bash
npm run dev   # app on http://localhost:5173
```

## Scripts

| Command | Location | Description |
| ------- | -------- | ----------- |
| `npm start` | `backend` | Start API server (nodemon) |
| `npm run dev` | `frontend` | Start Vite dev server |
| `npm run build` | `frontend` | Production build |
| `npm run preview` | `frontend` | Preview production build |
| `npm run lint` | `frontend` | ESLint |

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/v1/user/signup` | Register a new user |
| POST | `/api/v1/user/login` | Log in (sets JWT cookie) |
| POST | `/api/v1/user/logout` | Log out (clears JWT cookie) |
| POST | `/api/v1/user/google` | Google OAuth login |
| GET | `/api/v1/tasks` | List tasks |
| POST | `/api/v1/tasks` | Create a task |
| PUT | `/api/v1/tasks/reorder` | Reorder tasks (drag-and-drop) |
| PUT | `/api/v1/tasks/:id` | Update a task |
| DELETE | `/api/v1/tasks/:id` | Delete a task |

## Repository Layout

```
├── AGENTS.md            # operating manual for AI coding agents
├── SKILLS.md            # task workflows (load one before working)
├── ARCHITECTURE.md      # architecture blueprint + migration plan
├── backend/             # Express (legacy) → NestJS + Prisma (target)
├── frontend/            # React + Vite (legacy) → Next.js App Router (target)
└── images/              # screenshots
```

## Roadmap

- [x] Phase 0 — agent harness + architecture blueprint (this docs set)
- [ ] Phase 1 — NestJS skeleton; port users + auth; re-enable task-route auth guard
- [ ] Phase 2 — Prisma behind repositories
- [ ] Phase 3 — Next.js App Router frontend with three-layer data fetching + BFF
- [ ] Phase 4 — Vitest suites, CI, Playwright smoke test

## Future Enhancements

- User avatars
- Real-time notifications
- Teams / shared boards

## Known Issues

- Task endpoints currently unauthenticated (auth middleware disabled in legacy code — first fix in Phase 1)
- JWT cookie bug in production (fix direction: BFF route handlers, Phase 3)
- Minor UI alignment issues

## Contributing

Contributions, issues, and pull requests are welcome. Read `AGENTS.md` first — the architecture laws apply to every PR.

## Author

Vishnu Vardhan Vemula — [GitHub](https://github.com/vishnu-vemula)
