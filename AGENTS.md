# AGENTS.md — Ultra Tasker Engineering Agent Harness

Operating manual for AI coding agents (opencode, Claude Code, Copilot Workspace, Cursor, etc.) working in this repository. **Read this file and `ARCHITECTURE.md` fully before making any change.** Load the matching skill from `SKILLS.md` before starting a task.

## Project

**Ultra Tasker** — a production-grade CRM (contacts, companies, deals pipeline, tasks, dashboard, user management) with Firebase auth, Prisma + PostgreSQL, and a fully TypeScript feature-based codebase.

- Stack: Express + TS backend, React + Vite + TS frontend, Firebase Authentication, Prisma ORM, React Query, Tailwind.
- The old MERN task-manager code is gone; everything follows the target architecture described in `ARCHITECTURE.md`. There is no migration in flight — build new work on the existing patterns.

## Repository layout

```
├── AGENTS.md            ← you are here
├── SKILLS.md            ← task workflows (load one before working)
├── ARCHITECTURE.md      ← architecture laws + stack details
├── README.md
├── backend/             # Express + TS + Prisma + Firebase Admin
│   ├── prisma/          # schema.prisma, migrations, seed.ts
│   └── src/
│       ├── config/      # env.ts — the ONLY file reading process.env
│       ├── common/      # middleware (auth, errors), utils (AppError, asyncHandler)
│       ├── database/    # prisma.ts, firebase.ts
│       ├── features/    # one folder per feature
│       ├── container.ts # DI composition root
│       └── app.ts / main.ts
└── frontend/
    └── src/
        ├── features/    # one folder per feature (api/ hooks/ components/ model/)
        └── shared/      # api-client, UI primitives, format helpers, cross-feature types
```

## Commands

| What | Where | Command |
|------|-------|---------|
| Run backend | `backend/` | `npm run dev` (port 4000; needs `.env` — copy `.env.example`) |
| Migrate DB | `backend/` | `npx prisma migrate dev --name <change>` |
| Seed demo data | `backend/` | `npm run db:seed` (reads `SEED_OWNER_UID`) |
| Backend checks | `backend/` | `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` |
| Run frontend | `frontend/` | `npm run dev` (port 5173; needs `.env` from `.env.example`) |
| Frontend checks | `frontend/` | `npm run typecheck`, `npm run lint`, `npm run build` |

Running the app requires PostgreSQL and Firebase credentials (see README "Getting Started"). Typecheck/lint/test run without them.

## Architecture laws (non-negotiable)

1. **Feature-based organization.** Feature code goes in `backend/src/features/<name>/` or `frontend/src/features/<name>/`. Cross-cutting, feature-agnostic code goes in `common/` (backend) or `shared/` (frontend). If you're adding a second import from one feature into another, stop — extract to shared or reconsider.
2. **ORM only, behind repositories.** No Prisma calls in controllers or services. Only repository classes (and `DashboardService`, the one sanctioned aggregate) touch Prisma.
3. **Dependency injection.** Services receive repositories/collaborators via constructor; everything is wired in `backend/src/container.ts`. Never `new` a service inside a class, never import a service singleton. Read `process.env` only in `backend/src/config/env.ts`.
4. **TypeScript strict.** No `any`, no `@ts-ignore`, no non-null assertions unless provably safe. Backend types flow from Prisma models + Zod schemas; frontend types live in `shared/types.ts` and feature `model/` folders.
5. **Frontend three-layer data fetching.** `api/` = pure async functions (fetch, zero React imports) → `hooks/` = React Query wrappers (query keys, optimistic updates) → `components/` = render only. A component calling `fetch` directly is a bug.
6. **Validate at boundaries.** Every request body/query is parsed with a Zod schema in the controller; every env var is declared in `env.ts`; API responses are typed via `shared/types.ts`.
7. **Auth + ownership on every query.** All routers use `auth.requireAuth`; admin routes add `auth.requireRole('ADMIN')`. Every repository/service query filters by the requesting user's uid (`ownerId`). A query without an owner filter is a data-leak bug.
8. **No comments** explaining *what* code does; only *why*, when non-obvious.

## Code style

- Named exports only; `camelCase` TS files, `kebab-case.tsx` React components (`deal-board.tsx` exports `DealBoard`).
- API envelope: success `{ data }`, errors `{ error: { code, message, details? } }`. Errors: `AppError` with HTTP status; Zod failures → 422 automatically.
- Commits: conventional commits (`feat(deals): …`, `fix(auth): …`, `docs: …`, `refactor(tasks): …`).
- Secrets never enter code or git — `.env` files are gitignored; update `.env.example` when adding vars.
- Do not edit generated files (`package-lock.json`, `prisma/migrations/*` beyond creating new ones).

## Definition of done

1. Code follows the architecture laws (self-review against the checklist in `SKILLS.md` → review).
2. `npm run typecheck` and `npm run lint` pass in every touched workspace; `npm test` for backend changes.
3. Existing behavior still works — both dev servers still boot (when env allows).
4. Tests: add/extend Vitest specs for new services (fake repositories) and hooks; update fakes when repository interfaces change.
5. Docs updated if architecture, env vars, or commands changed (README + ARCHITECTURE.md).
6. Conventional commit; one logical change per commit; no secrets or lockfile noise.

## Known landmines (verify before assuming)

- **Role changes need a token refresh.** `PATCH /users/:id/role` sets a Firebase custom claim + DB row; the affected user's authorization only updates after their next ID-token refresh (frontend refreshes on reload/re-login — tell users to re-login).
- **`BOOTSTRAP_ADMIN_EMAILS` promotes on login only** — it can't demote; remove a user from the list and change their role in the admin UI instead.
- **Seed ownership** — `npm run db:seed` assigns everything to `SEED_OWNER_UID` (placeholder default). Re-run it with your real UID or you'll see an empty CRM.
- **Firebase private key escaping** — `FIREBASE_PRIVATE_KEY` must keep `\n` escapes; prefer the single-line `FIREBASE_SERVICE_ACCOUNT_KEY` JSON on Render/Heroku-style deploys.
- **`FIREBASE_SERVICE_ACCOUNT_KEY` beats discrete vars** which beat `GOOGLE_APPLICATION_CREDENTIALS` (ADC). Exactly one mechanism is needed or every request 401s/500s at startup.
- **Compound uniques** — Contact/Company/Deal/Task update/delete use `id_ownerId` compound keys (`@@unique([id, ownerId])` in schema). Preserve them; they enforce ownership at the DB layer.
- **`deals/reorder` is registered before `deals/:id`** in the router — keep that order or `reorder` gets captured as an `:id`.

## Task workflow (all agents)

1. Read this file + `ARCHITECTURE.md`.
2. Pick the matching skill in `SKILLS.md` and follow its steps.
3. Explore existing feature folders and mimic their patterns before writing new ones.
4. Make the smallest coherent change; verify with the commands above.
5. Self-review the diff against the architecture laws and Known landmines.
6. Report: what changed, files touched, verification output, and anything intentionally left as-is.
