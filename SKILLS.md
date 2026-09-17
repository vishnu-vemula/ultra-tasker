# SKILLS.md — TaskForge Agent Skills

Task workflows for AI coding agents. **Before starting any task, load the matching skill** (read the section fully and follow it step by step). Each skill ends with a verification gate — do not report done before passing it.

Index: [backend-feature](#1-backend-feature) · [frontend-feature](#2-frontend-feature) · [api-endpoint](#3-api-endpoint-end-to-end) · [schema-change](#4-schema-change-prismamongoose) · [bugfix](#5-bugfix) · [ts-migration](#6-ts-migration-legacy--target) · [testing](#7-testing) · [review](#8-review) · [docs](#9-docs)

Conventions referenced below are defined in `ARCHITECTURE.md`. Architecture laws referenced as **L1–L7** (see AGENTS.md).

---

## 1. backend-feature

**Use when:** adding a new backend feature module (e.g. `comments`, `teams`).

1. Check the feature doesn't already exist; check `ARCHITECTURE.md` §3.2 for the reference layout.
2. Create `backend/src/features/<name>/`:
   - `<name>.module.ts` — registers controllers + providers; export from `app.module.ts`.
   - `<name>.controller.ts` — thin: routes, DTOs, `@CurrentUser()`, guards. No Prisma, no business logic (**L2**).
   - `<name>.service.ts` — business logic; collaborators via constructor injection (**L3**).
   - `<name>.repository.ts` — the only place Prisma/Mongoose is touched (**L2**).
   - `dto/*.dto.ts` — class-validator decorators; every field typed and constrained (**L6**).
3. Cross-cutting code (guards, filters, pipes) goes in `common/`, not the feature.
4. Unit-test the service with a fake repository (skill 7); e2e-test the routes.
5. **Verify:** `npm run start:dev` boots; `npm run test` passes; no controller/service imports the ORM client.

## 2. frontend-feature

**Use when:** adding a new frontend feature (e.g. `comments`, `notifications`).

1. Check `ARCHITECTURE.md` §4.1 for the reference layout.
2. Create `frontend/src/features/<name>/` with the fixed inner structure:
   - `model/` — `types.ts` + `schema.ts` (Zod). Types first; components import from here only.
   - `api/<name>-api.ts` — pure async functions using `apiClient`; **zero React imports** (**L5**); parse responses with the Zod schema (**L6**).
   - `hooks/` — React Query wrappers (`use-<name>s.ts`, `use-create-<name>.ts`, …); define the query-key object here; optimistic updates with rollback for mutations.
   - `components/` — presentational, `kebab-case.tsx`; import data hooks, never `api/` (**L5**).
3. Shared/dumb UI goes in `shared/components/ui` (shadcn CLI only) — not in the feature.
4. Add the route as a thin `app/**/page.tsx` that renders the feature's top-level component.
5. **Verify:** `npm run lint` + `npm run typecheck` pass; grep confirms no `fetch(`/`axios` in `components/`.

## 3. api-endpoint (end-to-end)

**Use when:** adding or changing one endpoint across the stack.

1. Backend first: DTO → service method → repository method → controller route. Validate with the DTO (**L6**); protect with `JwtAuthGuard` unless it is auth itself (**L7**).
2. Contract: confirm request/response shapes; response envelope `{ data }` / `{ error: { code, message } }` (ARCHITECTURE.md §3.5).
3. Frontend: `model/schema.ts` (response validation) → `api/` function → `hooks/` wrapper → component usage. One layer at a time, never skipping.
4. If the response shape changed, update the Zod schema and every consumer in the same change.
5. **Verify:** curl/Supertest the endpoint (2xx + envelope); hook-level test for the new mutation/query; lint + typecheck both workspaces.

## 4. schema-change (Prisma/Mongoose)

**Use when:** changing a database model.

1. Update `prisma/schema.prisma` (or the Mongoose model while pre-Prisma).
2. Generate/author the migration: `npx prisma migrate dev --name <change>` (**L: never hand-edit generated migrations**).
3. Update the repository types/methods — repositories are the only callers, so nothing else should break (**L2**).
4. Update backend DTOs + frontend `model/schema.ts` to match the new fields.
5. Seed script if new tables need demo data.
6. **Verify:** migrate up on a scratch DB; e2e suite passes; typecheck passes (shape drift shows up here).

## 5. bugfix

**Use when:** fixing any defect.

1. Reproduce first — write the failing test (unit > e2e > manual curl). No test, no fix.
2. Root-cause in the correct layer: data issue → repository; logic → service; status/shape → controller/DTO; UI state → hook; rendering → component.
3. Apply the smallest fix at that layer; do not refactor drive-by code.
4. Check **Known landmines** in AGENTS.md — several bugs are already diagnosed there (disabled auth guard, port drift, cookie bug).
5. **Verify:** the new test passes; full test suite passes; commit as `fix(<area>): …`.

## 6. ts-migration (legacy → target)

**Use when:** porting legacy JS files to the target stack. Follow `ARCHITECTURE.md` §7 phases — never mix phases.

1. Pick the next file/module in phase order (backend: users → auth → tasks; frontend: auth → tasks).
2. Extract types from existing runtime shapes (Mongoose schema → TS types/DTOs; PropTypes/usage → `model/types.ts`).
3. Port into the target structure (skills 1–2) — do **not** keep legacy file names or patterns (`helper.js` hooks die here).
4. Delete the legacy file in the same commit; update every import.
5. Fix opportunistically while in there: auth guard re-enable, `TaskBoard .jsx` space, `fevicon.svg` typo, `nodemon` devDependency, "Vooshfoods" string.
6. **Verify:** both dev servers boot with zero runtime errors; lint + typecheck clean; feature manually exercised.

## 7. testing

**Use when:** writing tests for new or existing code.

1. Match the level to the behavior: pure logic → unit; controller wiring/auth → e2e (Supertest); hooks → Vitest + Testing Library with a `QueryClient` wrapper; components → render test via the hook's mock.
2. Backend units inject **fake repositories** (in-memory arrays) — no real DB, no mocks of Prisma internals (**L3** pays off here).
3. Frontend: mock at the `api/` boundary (msw or vi.mock of `api/` functions), never inside hooks.
4. Name files `*.spec.ts` colocated with the code (backend) or in `__tests__/` (frontend).
5. **Verify:** `npm run test` (and `test:e2e`) green; no snapshot-only tests for logic; coverage of failure paths (401, 422, rollback).

## 8. review

**Use when:** reviewing a diff (own or others') before merge.

Run the checklist in order; any "no" blocks the review:
- [ ] Laws L1–L7 hold (AGENTS.md) — especially: no ORM outside repositories, no `new` of services, no fetch in components, no `process.env` outside env modules.
- [ ] No `any`, `@ts-ignore`, or non-null assertions.
- [ ] Every changed input is validated (DTO/Zod); responses keep the envelope.
- [ ] Auth guards present on protected routes.
- [ ] Tests added/updated at the right level; failure paths covered.
- [ ] No secrets, no generated-file noise in the diff; conventional commit message.
- [ ] README/ARCHITECTURE updated if commands/env/architecture changed.
- [ ] Known landmines not re-introduced.

## 9. docs

**Use when:** README, ARCHITECTURE.md, AGENTS.md, or this file need changes.

1. Edit the minimal section; keep tables and laws in sync across the four files (commands, env vars, phase status are duplicated on purpose).
2. Env var changes must update: `ARCHITECTURE.md` §5 table + `.env.example` + the Zod env module.
3. Command changes must update: AGENTS.md Commands table + README quickstart.
4. **Verify:** grep the old value to confirm no stale mentions remain (`rg "REACT_APP|port 5000"`-style checks).
