# TaskForge — Architecture Blueprint

This document is the single source of truth for TaskForge's architecture. It defines the **target architecture** (feature-based, ORM-backed, dependency-injected, fully TypeScript) and the migration path from the current codebase. AI agents and humans must follow these rules for every change.

---

## 1. Principles

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **Feature-based organization** | All code for a feature (tasks, auth) lives in one self-contained folder — in both backend and frontend. No shared "god folders" of unrelated code. |
| 2 | **ORM for data access** | All database access goes through the ORM (Prisma) behind repositories. No raw queries in business logic, no Mongoose calls in controllers. |
| 3 | **Dependency injection** | Services receive collaborators (repos, config, other services) via constructor injection. No direct instantiation, no hidden singletons. Keeps code testable and swappable. |
| 4 | **TypeScript everywhere** | Strict mode, no `any`, no `@ts-ignore`. Types shared between layers via DTOs (backend) and schemas (frontend). |
| 5 | **Data fetching is separate from UI** (frontend) | Three strict layers: `api/` = pure async functions (fetch + types), `hooks/` = React Query wrappers, `components/` = rendering only. A component never calls `fetch`/`axios` directly. |
| 6 | **Validate at boundaries** | Zod/class-validator on every external input: request bodies, env vars, API responses. |

---

## 2. Current State → Target State

| Concern | Current (legacy) | Target |
|---------|------------------|--------|
| Backend language | JavaScript (ESM) | TypeScript (strict) |
| Backend framework | Express 4 | NestJS 10 (Express under the hood) |
| Data access | Mongoose calls inside controllers | Prisma ORM + repository classes |
| DI | None (module imports) | NestJS IoC container (constructor injection) |
| Validation | Manual / none | Zod + class-validator DTOs |
| Frontend framework | React 18 + Vite (SPA) | Next.js 14+ (App Router) |
| Frontend language | JSX | TSX |
| Data fetching | Axios inside `helper.js` hooks | `api/` pure functions + React Query hooks + BFF route handlers |
| Styling | Tailwind + Flowbite | Tailwind + shadcn/ui |
| DnD | react-beautiful-dnd (deprecated) | @hello-pangea/dnd (maintained fork) |
| Tests | None | Vitest + Supertest (backend), Vitest + Testing Library (frontend) |

> The `backend/` and `frontend/` folders currently hold the legacy app and are migrated in place, phase by phase (see §7). Do not mix legacy patterns into migrated code.

---

## 3. Backend Target Architecture (NestJS + Prisma + DI)

### 3.1 Layering

```
HTTP request
  → Controller        (route + DTO validation + auth guards; NO business logic, NO DB)
  → Service           (business logic, transactions; NO HTTP concepts)
  → Repository        (Prisma queries only; returns domain types)
  → Prisma ORM        (database)
```

- A controller must never import Prisma or a repository.
- A service must never touch `req`/`res` — it receives plain typed objects.
- Repositories are the only files allowed to call Prisma.

### 3.2 Folder structure (feature-based)

```
backend/
├── prisma/
│   ├── schema.prisma              # User, Task models
│   └── migrations/
├── src/
│   ├── main.ts                    # bootstrap: helmet, CORS+credentials, cookie-parser, validation pipe
│   ├── app.module.ts              # root module — registers feature modules
│   ├── config/
│   │   ├── env.ts                 # Zod-validated process.env (fails fast on boot)
│   │   └── config.module.ts       # exposes typed ConfigService via DI
│   ├── common/                    # cross-cutting, feature-agnostic
│   │   ├── guards/                # JwtAuthGuard, RolesGuard
│   │   ├── filters/               # global HttpExceptionFilter → { error: { code, message } }
│   │   ├── interceptors/          # logging, transform
│   │   ├── decorators/            # @CurrentUser()
│   │   └── dto/                   # pagination.dto.ts etc.
│   ├── database/
│   │   ├── prisma.module.ts       # global module providing PrismaService
│   │   └── prisma.service.ts      # extends PrismaClient, onModuleInit/onModuleDestroy
│   └── features/                  # ← one folder per feature
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── token.service.ts   # JWT sign/verify
│       │   ├── google.strategy.ts # Google OAuth
│       │   └── dto/               # signup.dto.ts, login.dto.ts
│       ├── users/
│       │   ├── users.module.ts
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   ├── user.repository.ts
│       │   └── dto/
│       └── tasks/
│           ├── tasks.module.ts
│           ├── tasks.controller.ts
│           ├── tasks.service.ts
│           ├── task.repository.ts
│           └── dto/               # create-task.dto.ts, update-task.dto.ts, reorder-tasks.dto.ts
└── test/
    ├── tasks.e2e-spec.ts
    └── auth.e2e-spec.ts
```

### 3.3 Dependency injection in practice

```ts
// features/tasks/tasks.module.ts
@Module({
  controllers: [TasksController],
  providers: [TasksService, TaskRepository],
  imports: [PrismaModule, JwtModule],
})
export class TasksModule {}

// features/tasks/tasks.service.ts
@Injectable()
export class TasksService {
  constructor(
    private readonly tasks: TaskRepository,      // ← injected, mocked in tests
    private readonly config: ConfigService,      // ← injected config, never process.env directly
  ) {}

  async reorder(userId: string, dto: ReorderTasksDto): Promise<Task[]> {
    return this.tasks.updateOrder(userId, dto.taskIds); // transaction lives in the repo
  }
}

// features/tasks/task.repository.ts
@Injectable()
export class TaskRepository {
  constructor(private readonly prisma: PrismaService) {}   // ← injected

  findMany(userId: string): Promise<Task[]> {
    return this.prisma.task.findMany({ where: { userId }, orderBy: { order: 'asc' } });
  }
}
```

**Rules**
- Register every provider in its feature module; never `new TasksService(...)`.
- Config is read via injected `ConfigService` backed by Zod-validated env — never `process.env` outside `config/env.ts`.
- Unit tests inject fakes: `const service = new TasksService(fakeRepo, fakeConfig);`

### 3.4 DTOs and validation

```ts
// features/tasks/dto/create-task.dto.ts
export class CreateTaskDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(TaskStatus) status!: TaskStatus;       // TO_DO | IN_PROGRESS | DONE
  @IsOptional() @IsUUID() assignedToId?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}
```

Enable `ValidationPipe({ whitelist: true, transform: true })` globally in `main.ts`.

### 3.5 API conventions

- Base path: `/api/v1`
- Responses: `{ data: T }` on success, `{ error: { code, message, details? } }` on failure
- Auth: JWT in **HttpOnly, SameSite=Lax cookies** (set by `/auth/login`, `/auth/signup`, `/auth/google`); `JwtAuthGuard` on every protected route — including all task routes (fixes the legacy gap where auth was commented out).
- Status codes: 200 read/update, 201 create, 204 delete, 401 unauthenticated, 403 forbidden, 404 not found, 422 validation.

---

## 4. Frontend Target Architecture (Next.js App Router + TS)

### 4.1 Folder structure (feature-based)

```
frontend/
├── src/
│   ├── app/                              # routing only — thin
│   │   ├── layout.tsx                    # providers (QueryClient, Theme, Toaster)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx                # authenticated shell (Header, guard)
│   │   │   └── board/page.tsx            # task board
│   │   └── api/                          # BFF route handlers (server-only proxy)
│   │       └── [...path]/route.ts        # forwards cookies to backend; never exposes BACKEND_URL
│   ├── features/                         # ← one folder per feature
│   │   ├── tasks/
│   │   │   ├── api/
│   │   │   │   └── task-api.ts           # pure async functions — NO React imports
│   │   │   ├── hooks/
│   │   │   │   ├── use-tasks.ts          # useQuery
│   │   │   │   ├── use-create-task.ts    # useMutation + optimistic update
│   │   │   │   └── use-reorder-tasks.ts
│   │   │   ├── components/
│   │   │   │   ├── task-board.tsx        # DnD board (client component)
│   │   │   │   ├── task-column.tsx
│   │   │   │   ├── task-card.tsx
│   │   │   │   └── task-dialog.tsx
│   │   │   └── model/
│   │   │       ├── types.ts              # Task, TaskStatus
│   │   │       └── schema.ts             # Zod schemas for create/update forms
│   │   └── auth/
│   │       ├── api/auth-api.ts
│   │       ├── hooks/use-session.ts
│   │       ├── components/google-oauth-button.tsx
│   │       └── model/schema.ts
│   ├── shared/                           # cross-feature, dumb building blocks
│   │   ├── components/ui/                # shadcn/ui primitives (button, input, dialog…)
│   │   ├── lib/                          # api-client.ts, query-client.ts, utils.ts
│   │   └── hooks/
│   └── middleware.ts                     # auth redirect (cookie presence check)
├── .env.local                            # NEXT_PUBLIC_APP_URL (BFF is same-origin)
└── next.config.ts
```

### 4.2 Data fetching — the three-layer rule

**Layer 1 — `api/` (pure functions, zero React):**

```ts
// features/tasks/api/task-api.ts
import { apiClient } from '@/shared/lib/api-client';
import type { Task } from '../model/types';

export async function getTasks(): Promise<Task[]> {
  const res = await apiClient.get('/api/v1/tasks');
  return taskSchema.array().parse(res.data.data);       // validate at boundary
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const res = await apiClient.post('/api/v1/tasks', input);
  return taskSchema.parse(res.data.data);
}
```

**Layer 2 — `hooks/` (React Query wrappers):**

```ts
// features/tasks/hooks/use-tasks.ts
export function useTasks() {
  return useQuery({ queryKey: taskKeys.all, queryFn: getTasks });
}

// features/tasks/hooks/use-create-task.ts
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onMutate: async (input) => { /* optimistic update + rollback */ },
    onSettled: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  });
}
```

**Layer 3 — `components/` (rendering only):**

```tsx
// features/tasks/components/task-board.tsx
export function TaskBoard() {
  const { data: tasks, isPending } = useTasks();   // hooks only — never fetch here
  if (isPending) return <BoardSkeleton />;
  return <DragDropContext onDragEnd={...}>{/* columns */}</DragDropContext>;
}
```

**Hard rules**
- `api/` files must not import React, hooks, or components.
- `components/` must not import `api/` directly — only through `hooks/`.
- Query keys live in one place per feature (`taskKeys` object in `hooks/use-tasks.ts`).
- All mutations use optimistic updates with rollback (existing app behavior — keep it).

### 4.3 BFF pattern (route handlers)

The browser talks **only** to same-origin Next.js route handlers (`/api/*`), which forward to the NestJS backend with the HttpOnly cookie attached. Benefits: no third-party-cookie/CORS issues in production, the backend URL stays server-side, and the production JWT cookie bug disappears.

---

## 5. Environments

| Layer | Var | Purpose |
|-------|-----|---------|
| backend | `DATABASE_URL` | Postgres/MySQL connection for Prisma (Mongo during migration) |
| backend | `JWT_SECRET`, `JWT_EXPIRES_IN` | token signing |
| backend | `COOKIE_SECRET` | cookie signing |
| backend | `FRONTEND_BASE_URL` | CORS allow-list |
| backend | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth |
| frontend | `NEXT_PUBLIC_APP_URL` | same-origin BFF base |
| frontend (server-only) | `BACKEND_URL` | used by route handlers — never `NEXT_PUBLIC_` |

Every variable must be declared in `backend/src/config/env.ts` / frontend env module with Zod — boot fails fast if missing.

---

## 6. Testing strategy

- **Backend unit**: services with fake repositories (no DB).
- **Backend e2e**: Supertest against the app with a test database (`npm run test:e2e`).
- **Frontend unit**: Vitest + Testing Library — test hooks with `QueryClient` wrapper.
- **Contract**: Zod schemas in `features/*/model` double as response validators; a change that breaks them is caught client-side in tests.

---

## 7. Migration plan (legacy → target)

1. **Phase 0 — Harness (done):** AGENTS.md, SKILLS.md, ARCHITECTURE.md, README refresh; fix README/code env drift.
2. **Phase 1 — Backend TS + DI:** introduce NestJS skeleton in `backend/src`, port `users` then `auth` (re-enable task-route auth guard), keep Mongoose behind repositories.
3. **Phase 2 — Prisma:** introduce Prisma with Mongo connector (incremental), then evaluate Postgres switch; repositories are the only code touched.
4. **Phase 3 — Frontend Next.js:** scaffold Next.js App Router, port `auth` feature, then `tasks` feature with the three-layer data fetching; add BFF route handlers; swap react-beautiful-dnd → @hello-pangea/dnd.
5. **Phase 4 — Quality:** Vitest suites, CI (typecheck + lint + test), error envelopes, Playwright smoke test.

Each phase ships behind working `npm run dev` at every commit. Never mix phases in one PR.
