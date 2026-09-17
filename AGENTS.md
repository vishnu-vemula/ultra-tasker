# AGENTS.md — TaskForge Engineering Agent Harness

Operating manual for AI coding agents (opencode, Claude Code, Copilot Workspace, Cursor, etc.) working in this repository. **Read this file and `ARCHITECTURE.md` fully before making any change.** Load the matching skill from `SKILLS.md` before starting a task.

## Project

**TaskForge** (formerly *Task-Manager*) — a full-stack task management app with auth, task CRUD, and a drag-and-drop Kanban board.

- **Status:** mid-migration. Legacy MERN (JS) code lives in `backend/` and `frontend/`; target is TypeScript + NestJS + Prisma + DI backend and Next.js App Router frontend. Always check §7 of `ARCHITECTURE.md` to see which phase a folder is in, and follow the **target** patterns for new code.
- **Live demo:** https://taskmanger-4sy5.onrender.com (Render free tier — cold starts are slow)

## Repository layout

```
├── AGENTS.md            ← you are here
├── SKILLS.md            ← task workflows (load one before working)
├── ARCHITECTURE.md      ← architecture laws + migration plan
├── README.md
├── backend/             # Express (legacy) → NestJS + Prisma (target)
├── frontend/            # React + Vite (legacy) → Next.js App Router (target)
└── images/              # screenshots
```

## Commands

| What | Where | Command |
|------|-------|---------|
| Run backend (legacy) | `backend/` | `npm start` (needs `nodemon`; port defaults to 3000, set `PORT` to override) |
| Run frontend (legacy) | `frontend/` | `npm run dev` |
| Build frontend | `frontend/` | `npm run build` |
| Lint frontend | `frontend/` | `npm run lint` |
| Backend (target, once NestJS lands) | `backend/` | `npm run start:dev`, `npm run test`, `npm run test:e2e`, `npx prisma migrate dev` |
| Frontend (target, once Next.js lands) | `frontend/` | `npm run dev`, `npm run lint`, `npm run typecheck`, `npm run test` |

Always run lint/typecheck for the area you touched before declaring a task done.

## Architecture laws (non-negotiable)

1. **Feature-based organization.** New code for a feature goes in that feature's folder (`backend/src/features/<name>/`, `frontend/src/features/<name>/`). Shared, feature-agnostic code goes in `common/` (backend) or `shared/` (frontend). If you're adding a second import from one feature into another, stop — extract to shared or reconsider.
2. **ORM only, behind repositories.** No database calls in controllers or services. Only repository classes touch Prisma/Mongoose.
3. **Dependency injection.** Services get repositories/config via constructor injection (NestJS IoC). Never `new` a service inside another class, never read `process.env` outside `backend/src/config/env.ts`.
4. **TypeScript strict.** No `any`, no `@ts-ignore`, no non-null assertions unless provably safe. Types come from DTOs (backend) and `model/` (frontend).
5. **Frontend three-layer data fetching.** `api/` = pure async functions (no React) → `hooks/` = React Query wrappers → `components/` = render only. A component calling `fetch`/`axios` directly is a bug.
6. **Validate at boundaries.** Every request body, env var, and external API response is validated (class-validator/DTO backend, Zod frontend).
7. **Auth is not optional.** All `/api/v1/tasks` routes require `JwtAuthGuard`. (Legacy has it commented out — do not replicate that bug; see Known landmines.)

## Code style

- TypeScript, strict; named exports only; `camelCase` files for TS modules, `kebab-case` for React components (`task-board.tsx` exports `TaskBoard`).
- Commits: conventional commits (`feat(tasks): …`, `fix(auth): …`, `docs: …`, `refactor(tasks): …`).
- No comments explaining *what* code does; only *why*, when non-obvious.
- Secrets never enter code or git — env vars only, declared in the env modules listed in `ARCHITECTURE.md` §5.
- Do not edit generated files (`package-lock.json`, `prisma/migrations/*` beyond creating new ones, shadcn `components/ui/*` except via its CLI).

## Definition of done

A task is done only when all of these hold:

1. Code follows the architecture laws above (agent self-reviews against the checklist).
2. `npm run lint` (and `typecheck` where it exists) passes in the touched workspace.
3. Existing behavior still works — `backend` and `frontend` dev servers still boot.
4. Tests: add/extend Vitest specs for new services/hooks; update fakes when repositories change.
5. Docs updated if architecture, env vars, or commands changed (README + ARCHITECTURE.md).
6. Commit messages follow conventional commits; one logical change per commit; never commit secrets or lockfile noise unrelated to the change.

## Known landmines (verify before assuming)

- `backend/routes/taskRoutes.js` — `router.use(authMiddleware)` is commented out; task endpoints are currently unauthenticated. Any work in tasks must restore the guard.
- `backend/server.js` defaults to port **3000** (README previously said 5000) and contains a leftover "Vooshfoods" greeting string — remove when touching that file.
- `nodemon` is used by `npm start` but missing from backend devDependencies — add it on next backend change.
- Frontend env var is `VITE_BACKEND_BASE_URL` (not `REACT_APP_API_URL`).
- `frontend/src/components/TaskBoard .jsx` has a space in the filename; `public/fevicon.svg` is a typo — fix opportunistically when touching those files.
- `react-beautiful-dnd` is unmaintained; target is `@hello-pangea/dnd` (drop-in fork).
- Production JWT cookie bug is a known open issue (see BFF pattern in `ARCHITECTURE.md` §4.3 for the fix direction).

## Task workflow (all agents)

1. Read this file + `ARCHITECTURE.md`.
2. Pick the matching skill in `SKILLS.md` and follow its steps.
3. Explore existing feature folders and mimic their patterns before writing new ones.
4. Make the smallest coherent change; verify with the commands above.
5. Self-review the diff against the architecture laws and Known landmines.
6. Report: what changed, files touched, verification output, and anything intentionally left as-is.
