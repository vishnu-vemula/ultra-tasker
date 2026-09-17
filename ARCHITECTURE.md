# Ultra Tasker — Architecture

Single source of truth for architecture decisions. Every PR is reviewed against these laws (see `AGENTS.md` for the agent-facing summary and `SKILLS.md` for task workflows).

---

## 1. System overview

```
Browser (React + Vite TS SPA)
  │  Firebase JS SDK ── email/password + Google sign-in
  │  Authorization: Bearer <Firebase ID token>
  ▼
Express API (TypeScript)                     Firebase Auth (identity, custom claims)
  ├─ helmet / CORS allow-list / rate limit
  ├─ Zod validation (controllers)
  ├─ Services (business logic, DI)
  ├─ Repositories (Prisma only)
  ▼
PostgreSQL via Prisma ORM
```

- **Identity** lives in Firebase; **authorization** (roles) is a Firebase custom claim mirrored to a `User` row.
- **Data ownership**: every CRM row carries `ownerId`; all queries filter by it (law 7). The DB layer enforces it with `@@unique([id, ownerId])` compound keys.
- **Admin**: users in `BOOTSTRAP_ADMIN_EMAILS` are promoted on first login; admins can change roles via `PATCH /users/:id/role` (sets claim + row).

## 2. Backend (`backend/`)

### 2.1 Layering

```
router        route table + guards (auth.requireAuth, requireRole) — reorder-style static routes before /:id
controller    thin: requireUser + Zod parse (body/query) + delegate + envelope response
service       business logic (ownership checks, position math, FK ownership guards)
repository    the only layer that touches Prisma
```

- Controllers never import Prisma; services never touch `req`/`res`.
- Cross-feature ownership checks (e.g. "does this contact belong to me?") are done through the feature's own repository (`relationOwnedByOwner`) — services accept narrow collaborator interfaces, not other services.

### 2.2 Feature folder shape

```
src/features/<name>/
├── <name>.router.ts        # build<Name>Router(controller, authMiddleware)
├── <name>.controller.ts    # class with asyncHandler methods
├── <name>.service.ts       # class, collaborators via constructor
├── <name>.repository.ts    # I<Name>Repository interface + Prisma implementation
├── <name>.schemas.ts       # Zod: list query + create/update bodies
└── <name>.service.spec.ts  # unit tests with fake repositories
```

### 2.3 Dependency injection

There is no DI framework. `src/container.ts` is the composition root: it instantiates Prisma, repositories, services, controllers, routers exactly once and hands routers to `app.ts`. `app.ts` and `main.ts` contain no feature logic.

Rules:
- Services declare constructor dependencies as repository **interfaces** (`IContactsRepository`), so unit tests pass in-memory fakes.
- Only `container.ts` may `new` services/controllers.
- `process.env` is read exclusively in `src/config/env.ts` (Zod-validated, fails fast at boot).

### 2.4 Auth flow

1. Client sends `Authorization: Bearer <Firebase ID token>`.
2. `AuthMiddleware.requireAuth` verifies via `firebase-admin` `verifyIdToken`.
3. `UsersService.ensureFromToken` upserts/refreshes the `User` row (1h in-memory cache per uid) and applies bootstrap-admin promotion.
4. `req.user = { uid, email, role }`; `requireRole('ADMIN')` guards admin routes.
5. Errors: 401 `UNAUTHENTICATED`, 403 `FORBIDDEN` — always the error envelope.

### 2.5 Error handling

`common/middleware/error.middleware.ts` is the single exit path:

| Source | Status | Code |
|--------|--------|------|
| `AppError` | its `.status` | its `.code` |
| Zod `ZodError` | 422 | `VALIDATION_ERROR` (+ field details) |
| Prisma `P2025` | 404 | `NOT_FOUND` |
| Prisma `P2002` | 409 | `CONFLICT` |
| Prisma `P2003` | 422 | `INVALID_RELATION` |
| anything else | 500 | `INTERNAL_ERROR` (logged, never leaked) |

### 2.6 Domain model (Prisma)

```
User (id = Firebase UID, role)
Company ──< Contact ──< Deal >── Company
                └────< Task >────┘
```

- Enums: `Role`, `ContactStatus`, `DealStage` (NEW→QUALIFIED→PROPOSAL→NEGOTIATION→WON/LOST), `TaskStatus`, `TaskPriority`.
- `Deal.position` (float) orders cards inside a stage; `POST /deals` appends at `max+1`; `PATCH /deals/reorder` writes batch updates in a transaction.
- Relation deletes: owner cascade (`User`), `SetNull` for contact/company links (history survives).

## 3. Frontend (`frontend/`)

### 3.1 Folder shape

```
src/features/<name>/
├── api/<name>-api.ts     # pure async functions, apiFetch, ZERO React imports
├── hooks/                # React Query: query keys, optimistic updates, toasts
├── components/           # presentational, consume hooks only
└── model/schema.ts       # form Zod schemas
src/shared/               # api-client, types.ts, format helpers, UI primitives
```

### 3.2 Three-layer data rule (law 5)

- `api/` functions own URL/typing concerns and parse the envelope via `shared/lib/api-client.ts` (`ApiError` on failures).
- `hooks/` own query keys (`['deals', params]`), optimistic mutations with rollback (`useReorderDeals`), and cache invalidation (`['deals']`, `['dashboard']`).
- `components/` never import `api/` directly.

### 3.3 Auth on the client

`firebase.ts` initializes the SDK from `VITE_FIREBASE_*` env. `AuthProvider` (features/auth) tracks the Firebase user, calls `POST /auth/session` once per login to sync the profile + role, and exposes `{ firebaseUser, profile, role, loading }`. `App.tsx` guards routes (`RequireAuth`, admin-only `/settings/users`).

## 4. Environments

Declared and validated in `backend/src/config/env.ts`; mirrored in `.env.example` files.

| Var | Where | Purpose |
|-----|-------|---------|
| `DATABASE_URL` | backend | Postgres (add `?sslmode=require` on Neon/Supabase) |
| `CORS_ORIGIN` | backend | comma-separated browser origins |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | backend | single-line service-account JSON (preferred) |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | backend | discrete alternative |
| `BOOTSTRAP_ADMIN_EMAILS` | backend | emails promoted to ADMIN on login |
| `SEED_OWNER_UID` | backend | seed data owner |
| `RATE_LIMIT_MAX` | backend | requests / 15 min / IP |
| `VITE_API_BASE_URL` | frontend | API base, default `http://localhost:4000/api/v1` |
| `VITE_FIREBASE_*` | frontend | web-app config (public by design) |

## 5. Testing strategy

- **Backend unit (Vitest)**: services with fake repositories — ownership scoping, position math, FK guards. No DB required.
- **Frontend**: typecheck + lint + build are the current gates; hook tests with `QueryClient` wrapper are the next step.
- Contract safety: frontend types in `shared/types.ts` must stay in sync with Zod schemas — changing one without the other is a review blocker.

## 6. Future work (proposals, not commitments)

CI pipeline, Playwright smoke tests, e2e Supertest suite against a throwaway Postgres, BFF/proxy deployment option, activity timeline, CSV import/export.
