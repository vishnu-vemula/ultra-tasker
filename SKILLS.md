# SKILLS.md — Ultra Tasker Agent Skills

Task workflows for AI coding agents. **Before starting any task, load the matching skill** (read the section fully and follow it step by step). Each skill ends with a verification gate — do not report done before passing it.

Index: [add-feature](#1-add-feature) · [api-endpoint](#2-api-endpoint-end-to-end) · [schema-change](#3-schema-change-prisma) · [bugfix](#4-bugfix) · [testing](#5-testing) · [review](#6-review) · [docs](#7-docs)

Architecture laws referenced as **L1–L8** (see AGENTS.md). Conventions and folder shapes live in `ARCHITECTURE.md`.

---

## 1. add-feature

**Use when:** adding a new domain entity (e.g. `notes`, `activities`) to the CRM.

1. Model it: Prisma model with `ownerId` relation + enums; run skill 3.
2. Backend feature folder `backend/src/features/<name>/` with all six files (router, controller, service, repository + interface, schemas, spec) — copy the shape from `features/companies/` (simplest) and escalate complexity via `features/deals/` (positions, relations).
3. Wire it: register in `container.ts` (repos → services → controllers → routers) and mount in `app.ts` under `/api/v1/<name>` (**L3**).
4. Guard it: `router.use(auth.requireAuth)`; every repo query filters `ownerId` (**L7**).
5. Frontend feature folder `frontend/src/features/<name>/` (api → hooks → components → model) plus the route in `App.tsx` and sidebar link in `shared/components/app-shell.tsx` (**L5**).
6. Add types to `frontend/src/shared/types.ts` if other features consume them.
7. **Verify:** `npm run typecheck` + `npm run lint` in both workspaces, `npm test` in backend, service spec added.

## 2. api-endpoint (end-to-end)

**Use when:** adding or changing one endpoint.

1. Backend: schema (Zod) → service method → repo method → controller route → router. Static sub-routes (like `deals/reorder`) must be registered **before** `/:id` routes.
2. Contract: response stays enveloped (`{ data }`); errors via `AppError` (never `res.status` in controllers).
3. Frontend: type in `shared/types.ts` → `api/` function → `hooks/` wrapper (keys + invalidations) → component usage. One layer at a time.
4. Update both `README.md` API table and the skill-9 doc sync if the surface changed.
5. **Verify:** unit test for the service path; typecheck + lint both workspaces; manual curl against dev server when env allows.

## 3. schema-change (Prisma)

**Use when:** changing any model, enum, or index.

1. Edit `prisma/schema.prisma`. Preserve `ownerId` + `@@unique([id, ownerId])` on CRM models — they enforce ownership at the DB layer.
2. `npx prisma migrate dev --name <change>` (needs a reachable `DATABASE_URL`); never hand-edit generated migrations.
3. Update the repository interface + implementation first; compiler errors then find every consumer.
4. Update Zod schemas (backend) and `shared/types.ts` (frontend) in the same change.
5. Extend `prisma/seed.ts` if demo data should cover it.
6. **Verify:** `npm run typecheck` + `npm run lint` + `npm test` in backend; typecheck in frontend.

## 4. bugfix

**Use when:** fixing any defect.

1. Reproduce with a failing test (unit > e2e > manual curl). No test, no fix.
2. Locate the right layer: envelope/status → controller; business rule/ownership → service; query/index → repository; cache/optimistic UI → hooks; rendering → component.
3. Check **Known landmines** in AGENTS.md first — several failure modes are already diagnosed there (token refresh after role change, Firebase key escaping, seed ownership).
4. Smallest fix at that layer; no drive-by refactors.
5. **Verify:** new test passes; full suite passes; `fix(<area>): …` commit.

## 5. testing

**Use when:** writing or extending tests.

- Backend units instantiate the service with a **fake repository** (in-memory maps, `vi.fn()`) — never mock Prisma internals (**L3** enables this).
- Cover the laws, not just happy paths: `ownerId` scoping (list/update/delete must not reach other owners' rows), FK ownership guards, position math on deals, 404 on missing-owned.
- Colocate as `<name>.service.spec.ts`; Vitest is already configured.
- Frontend: mock at the `api/` boundary (`vi.mock('../api/…')`), test hooks with a fresh `QueryClient`.
- **Verify:** `npm test` green; at least one failure-path assertion per spec.

## 6. review

**Use when:** reviewing any diff before merge. Any "no" blocks.

- [ ] Laws L1–L8 hold — especially: no Prisma outside repositories/container, no `new` of services outside `container.ts`, no `process.env` outside `config/env.ts`, no fetch in components, no Zod-less request bodies.
- [ ] Every new query path filters by `ownerId`; compound uniques preserved.
- [ ] Router order: static routes before `/:id`; auth guards present.
- [ ] No `any`, `@ts-ignore`, non-null assertions, or comments.
- [ ] Frontend cache keys consistent (`['<entity>', params]`) and mutations invalidate themselves + `['dashboard']` when stats change.
- [ ] `.env.example` updated for new vars; no secrets in the diff.
- [ ] Typecheck + lint + tests pass in touched workspaces.
- [ ] README/ARCHITECTURE updated if commands/env/architecture changed.

## 7. docs

**Use when:** README, ARCHITECTURE.md, AGENTS.md, or this file need changes.

1. Edit the minimal section; keep duplicated facts (commands, env vars, landmines) in sync across all four files.
2. Env var changes: `ARCHITECTURE.md` §4 table + relevant `.env.example` + `backend/src/config/env.ts` must all move together.
3. Command changes: AGENTS.md Commands table + README Scripts table.
4. **Verify:** grep the repo for the old value to catch stale mentions.
