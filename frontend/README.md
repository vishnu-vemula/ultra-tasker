# Ultra Tasker — Frontend

Next.js 14 (App Router) + React 18 + TypeScript frontend for the Ultra Tasker CRM. Talks to the Express API ([../backend](../backend)) with Firebase ID tokens.

## Quick start

```bash
cp .env.example .env   # fill in your Firebase web-app config (NEXT_PUBLIC_*)
npm install
npm run dev            # http://localhost:3000
```

Make sure `CORS_ORIGIN` in `backend/.env` includes `http://localhost:3000`.

## Commands

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (`next/core-web-vitals` + `next/typescript`) |
| `npm run typecheck` | `tsc --noEmit` |

## Architecture

Views are `.tsx`; operations are `.ts`.

```
app/                          # Next.js App Router — views only (.tsx)
├── layout.tsx                # <html>/<body> + globals.css + Providers
├── providers.tsx             # 'use client': React Query + AuthProvider + toasts
├── not-found.tsx             # redirect fallback for unknown routes
├── (auth)/                   # public routes
│   ├── login/page.tsx
│   └── signup/page.tsx
└── (crm)/                    # auth-guarded group — layout redirects to /login
    ├── page.tsx              # dashboard
    ├── contacts/[contactId]/ # list + detail
    ├── companies/[companyId]/
    ├── deals/[dealId]/       # kanban + detail/quote builder
    ├── tasks/
    ├── notifications/
    └── settings/             # tags · products · users (users = ADMIN only)

src/
├── features/<name>/          # one folder per feature
│   ├── api/<name>-api.ts     # pure async fetch functions — zero React imports (.ts)
│   ├── hooks/                # React Query: query keys, optimistic updates (.ts)
│   ├── components/           # presentational views, consume hooks only (.tsx)
│   └── model/schema.ts       # form Zod schemas (.ts)
└── shared/                   # cross-feature code
    ├── lib/api-client.ts     # envelope parsing, ApiError, auth header
    ├── lib/firebase.ts       # lazy client-only Firebase singleton
    ├── components/           # UI primitives (dialog, badges, app shell…)
    ├── hooks/                # use-debounced-value, audit timeline hook
    └── types.ts              # API DTOs shared across features
```

### Rules (from [ARCHITECTURE.md](../ARCHITECTURE.md))

- **Three-layer data fetching**: `api/` → `hooks/` → `components/`. A component calling `fetch` directly is a bug.
- **Thin pages**: every `app/**/page.tsx` is a `'use client'` wrapper that renders a feature component — no business logic in routes.
- **Auth**: Firebase SDK (client) → `Authorization: Bearer <ID token>` on every API call; the `(crm)` layout and the users page enforce login/role redirects.
- **Env vars**: only `NEXT_PUBLIC_*` (inlined at build time) — see `.env.example`.

See the root [README](../README.md) for the full picture, [ARCHITECTURE.md](../ARCHITECTURE.md) for the laws, and [AGENTS.md](../AGENTS.md) for agent workflows.
