# MyEdSpace Core Journey — Design

**Date:** 2026-07-04
**Status:** Implemented

## Overview

A small full-stack app mocking the MES core user journey — parent purchases → student onboards → student accesses the LMS — built to demonstrate architecture and product-flow judgment under a 3–4 hour budget, not to be production-complete. This is the companion spec to [discussion.md](./discussion.md), which documents the interviews that produced these decisions; see `docs/architecture.html` for the visual system/data-flow diagrams.

## Decisions

| Decision | Resolution | Rationale |
|---|---|---|
| Backend | NestJS (TypeScript) | Explicit module/controller/service/DI layering, familiar to engineers coming from Spring |
| Frontend | React + Vite + React Router, Tailwind | Matches MES's stated stack; fast iteration |
| Persistence | Real Postgres via Docker Compose | The brief calls out "architecture and system design" as a criterion — a migrated, seeded relational DB is a more honest demonstration of the data model than an in-memory map |
| ORM | Prisma 7, config-file + driver-adapter model | See [discussion.md § Session 3](./discussion.md#session-3--prisma-vs-drizzle-and-why-not-just-use-prismas-generated-types) — kept over Drizzle; the migration cost from an already-working, tested backend outweighed the generated-artifact friction |
| Auth | JWT (`@nestjs/jwt` + Passport), no session store | Satisfies "only authenticated students access the LMS" without a real identity system |
| Purchase → student handoff | Invitation-token link, not direct account creation | Mirrors a real invite flow without needing an email provider |
| Multi-course support | Enrollment reuse on repeat purchase for an existing student email | Deliberate scope call made explicit up front, not discovered as an edge case |
| Package structure | pnpm workspace (`backend/`, `frontend/`, `packages/types`), not a full monorepo restructure | Only one concrete duplication existed (`frontend/src/lib/types.ts`); a build-graph tool (Turborepo/Nx) would add ceremony with no real caching/orchestration problem to solve |
| Shared types scope | `packages/types` consumed by frontend only, not backend | Backend's Prisma types and its hand-shaped DTOs aren't 1:1 with the wire format (see discussion.md); forcing backend to depend on it would create a false type-safety story |
| Networking | nginx reverse-proxies `/api/*` to the backend, single origin | Avoids CORS entirely; matches a plausible real deployment (one edge, API behind it) |
| Lint/format | Biome (replacing ESLint/Prettier/oxlint) | One fast tool instead of three configs; `useImportType` rule disabled — it silently broke NestJS DI by rewriting value imports to type-only imports |
| Testing | Backend integration tests (Jest + Supertest) against a real DB; no frontend test suite; full manual browser pass via Chrome DevTools MCP | Buys the most confidence per hour — same path a human QA pass would take |
| Source delivery | Public GitHub repo | Simpler than per-user private sharing; brief explicitly allows either |

## System Shape

```
Browser → nginx (:3000, static React build) → /api/* proxied → NestJS (:4000) → Postgres
```

Backend feature modules, each with its own controller/service, sharing a global `PrismaModule`: `courses`, `orders`, `enrollments`, `auth`, `lms`.

Data model: `Course` ← `Order` (mock checkout record) ← `Enrollment` (invitation token + status) → `Student` → `Lesson` → `LessonProgress`. Full ER diagram and request-sequence diagrams for all three journey stages are in `docs/architecture.html`.

## Explicitly Out of Scope

- Real payment processing (mock checkout only, per the brief)
- Real identity provider / password reset / email delivery (invitation links are shown directly on the confirmation screen, not emailed)
- Frontend test suite (traded for a full manual + backend-integration pass given the time budget)
- Build-graph/task-orchestration tooling (Turborepo, Nx) — no problem for it to solve at this scale
- Regenerating `docs/architecture.html` automatically from schema/code — it's a dated, hand-maintained snapshot, acceptable for a fixed-scope exercise
