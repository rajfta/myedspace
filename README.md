# MyEdSpace — Core Journey Prototype

A small full-stack app mocking the MES core user journey: **Parent purchases → Student onboards → Student accesses the LMS.**

## Running it

```
docker compose up --build
```

Then open **http://localhost:3000**.

That single command starts three services: Postgres, the NestJS API (runs migrations + seeds the three sample courses on boot), and the React app served via nginx (which proxies `/api/*` to the backend).

No `.env` setup is required to run via Docker — all config is wired through `docker-compose.yml`. To run both apps outside Docker instead, `pnpm run dev` at the root starts the backend (watch mode) and frontend (Vite) together; `backend/.env` already points at `localhost:5432` — start a local Postgres or run `docker compose up db` first.

This repo is a [pnpm workspace](https://pnpm.io/workspaces) (`corepack enable` picks up the pinned version automatically). One `pnpm install` at the root installs `backend/`, `frontend/`, and `packages/types/`. Root-level scripts (`pnpm run dev` / `build` / `lint` / `lint:fix`) fan out to every package via `pnpm -r`; run a single package's script with `pnpm --filter <name> run <script>`.

## Architecture overview

See [`docs/architecture.html`](./docs/architecture.html) for the full visual breakdown (open it directly in a browser — no build step) — system components, sequence diagrams for all three journey stages, and the Prisma data model as an ER diagram.

```
┌─────────────┐      /api/*      ┌───────────────┐        ┌──────────────┐
│   nginx      │ ───────────────▶│  NestJS API    │───────▶│  Postgres    │
│ (React SPA)  │◀─────────────── │  (Prisma ORM)  │◀───────│              │
└─────────────┘   static assets  └───────────────┘        └──────────────┘
   :3000 (host)                     :4000 (internal)
```

- **Frontend**: React + Vite SPA (React Router), styled with Tailwind CSS. Built as static assets and served by nginx in production; nginx also reverse-proxies `/api/*` to the backend container so the browser only ever talks to a single origin (no CORS).
- **Backend**: NestJS (TypeScript) with a Prisma-backed Postgres database. Feature modules: `courses`, `orders`, `enrollments`, `auth`, `lms` — each with its own controller/service, sharing a global `PrismaModule`.
- **Auth**: no real identity provider. A student sets a password during onboarding (or logs in later); the API issues a signed JWT (`@nestjs/jwt`), validated by a Passport JWT strategy guarding all `/api/me`, `/api/courses/:id/lessons`, `/api/lessons/*` routes.
- **`packages/types`**: a types-only workspace package holding the API response shapes (`Course`, `OrderResult`, `EnrollmentInfo`, `AuthResult`, `Dashboard`, lesson types). The frontend imports these instead of hand-duplicating them; the backend doesn't depend on the package — its actual runtime response shapes remain the source of truth, and this package documents the wire format for the one consumer that needs a static copy.

### Data model

`Course` (subject, yearRange, price) ← `Order` (mock checkout record) ← `Enrollment` (invitation token + status, links a course purchase to a `Student` once activated) → `Student` (credentials) → `Lesson` (per course) → `LessonProgress` (student↔lesson completion join).

A `Student` can hold multiple `Enrollment`s — buying a second course for an already-activated student email re-uses the account instead of creating a duplicate.

### Request flow

1. `GET /api/courses` — public, powers the product page.
2. `POST /api/orders` — mock checkout (parent + student email, fake card fields that are validated for shape only, never charged). Creates an `Order` + a `PENDING` `Enrollment` with a unique invitation token, returned as an invitation link.
3. `GET /api/enrollments/:token` / `POST /api/enrollments/:token/activate` — resolves the invitation and either creates a new `Student` (name + password) or, if that email already has an account, just links the new enrollment to it. Both paths return a JWT.
4. `POST /api/auth/login` — for returning students.
5. `GET /api/me`, `GET /api/courses/:id/lessons`, `GET /api/lessons/:id`, `POST /api/lessons/:id/complete` — JWT-protected LMS routes; lesson/course access is checked against the student's *activated* enrollments (403 if they never purchased that course).

## Key technical decisions

- **NestJS over a bare Express/plain Node backend** — the module/controller/service/DI structure gives the same kind of explicit layering Java engineers would expect from Spring, while staying in the Node ecosystem for speed of iteration inside a 3–4 hour scope.
- **Prisma 7, config-file + driver-adapter model** — the schema no longer holds a `datasource { url }`; connection config lives in `backend/prisma.config.ts`, and `PrismaService` connects via an explicit `@prisma/adapter-pg` driver adapter instead of Prisma's bundled query engine binary. The generator (`prisma-client`, `moduleFormat = "cjs"`) emits real TypeScript into `backend/src/generated/prisma`, which is what NestJS actually imports. One consequence worth calling out: the generated client's internal imports use Node's `nodenext`-style `./file.js` specifiers that point at `.ts` files, which neither `ts-node` nor default Jest resolution understand — the seed script runs via `tsx` instead of `ts-node`, and `test/jest-e2e.json` maps `.js` → no-extension in `moduleNameMapper` so ts-jest can resolve the generated files.
- **pnpm + Biome over npm + ESLint/Prettier** — pnpm's strict, symlinked `node_modules` catches phantom dependencies that npm's flat install hides, and Biome replaces two tools (and their config files) with one fast Rust binary doing both linting and formatting. One real gotcha from this migration: Biome's `useImportType` rule auto-rewrites `import { Foo }` to `import type { Foo }` wherever a class is only used in a type position — which is exactly how NestJS constructor injection and `@Body()` DTOs look. TypeScript's decorator-metadata emission needs the *value* import to reflect a real class at runtime, so `import type` there silently breaks Nest's DI (and DTO validation) without a compile error. That rule is now off in the root `biome.json`.
- **Real Postgres via Docker Compose, not an in-memory store** — the brief explicitly calls out "architecture and system design" as an evaluation criterion; a migrated, seeded relational database is a small amount of extra setup for a much more honest demonstration of the data model than an in-memory map.
- **Invitation-token model for parent→student handoff** — the parent supplies the student's email at checkout; checkout returns an invitation link (`/onboard/:token`) rather than creating the student account directly, mirroring how a real invite flow would work without needing an email provider (the link is just shown on the confirmation screen).
- **Enrollment reuse for repeat purchases** — rather than only supporting a single course per student, activation checks whether a `Student` already exists for the invited email; if so it links the new enrollment to the existing account instead of erroring or duplicating. This was a deliberate scope call made explicit up front rather than discovered as an edge case later.
- **JWT auth, no session store** — satisfies "only authenticated students can access the LMS" without building a real identity system; stateless and simple to guard routes with a Passport strategy.
- **nginx reverse proxy for `/api`, single origin** — avoids CORS configuration entirely and matches how this would likely be deployed for real (one edge, API behind it).
- **pnpm workspace, not a full monorepo restructure** — the only concrete duplication in the codebase was `frontend/src/lib/types.ts` hand-mirroring backend response shapes, so that's what the workspace conversion targets: a single root lockfile, a shared `packages/types` types package, and root-level `pnpm -r` scripts. No `apps/`/`packages/` folder rename, no Turborepo/Nx — with two runtime services and one types package, a build-graph tool would add ceremony without a real caching or task-orchestration problem to solve. Consequence worth flagging: Docker build contexts moved from per-service (`./backend`, `./frontend`) to the repo root, so both Dockerfiles now `COPY` the root lockfile/workspace file plus each sibling package's `package.json` before running a filtered `pnpm install --frozen-lockfile --filter=<service>...`.
- **Testing scope** — a handful of backend integration tests (Jest + Supertest) exercising the entire purchase → onboarding → LMS-gating journey against a real database, rather than unit tests with mocks or any frontend test suite. Given the time budget, this buys the most confidence per hour: it's the same path a human QA pass would take, and it's what I manually re-verified via a real browser (Chrome DevTools MCP) against both the dev server and the final Docker Compose stack.

## AI usage

This was built with Claude Code end-to-end. Before writing any code — and before every later architectural fork (the monorepo conversion, the ORM choice) — Claude's `grill-me` skill interviewed me branch by branch, one question at a time, each with a recommended default and rationale, rather than deciding silently. The attached artifacts:

- [`docs/ai-plan/discussion.md`](./docs/ai-plan/discussion.md) — the interview log across all four sessions (initial build, monorepo conversion, Prisma-vs-Drizzle, this doc + delivery audit), with the actual questions, recommended defaults, and decisions made.
- [`docs/ai-plan/design.md`](./docs/ai-plan/design.md) — the resulting decisions spec, in the same discussion → design-doc format the `superpowers` brainstorming skill uses.
- [`docs/architecture.html`](./docs/architecture.html) — the visual system/data-flow doc requested during session 4, hand-built by Claude from the interview outcomes.

Implementation proceeded end-to-end with Claude Code driving the terminal, editing files, and using a real browser (via the Chrome DevTools MCP tool) to click through the entire purchase → onboarding → LMS flow — including the multi-course "buy a second course for the same student" path and every access-control edge case (401/403) — against both the local dev servers and the final `docker compose up` stack, plus the automated backend test suite (`pnpm run test:e2e` in `backend/`). The full 23-step manual test log is in [`docs/MANUAL_TESTS.md`](./docs/MANUAL_TESTS.md), re-run and re-verified after the pnpm/Biome/Prisma 7 migration.
