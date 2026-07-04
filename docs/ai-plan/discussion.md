# AI-Assisted Development — Discussion Log

This is the artifact the brief asks for under "how you used AI tools during development, and attach any artefacts produced." The entire application was built with Claude Code, and every non-trivial design fork was resolved through an interview (Claude's `grill-me` skill: one question at a time, a recommended default with rationale, the human picks) rather than Claude silently deciding. This file logs those interviews; [design.md](./design.md) is the resulting decisions spec.

**Note on completeness:** the first interview below (initial build) happened in an earlier session before this repo had a convention for saving interview artifacts — it's reconstructed here from the README's summary of what was covered and the decisions actually present in the code, not a verbatim transcript. Sessions 2–4 are reproduced from the actual conversation history.

---

## Session 1 — Initial build (core journey)

Before any code was written, Claude interviewed the author branch-by-branch on every architectural fork in the exercise. Topics covered, with the decision that was actually built:

| Branch | Decision |
|---|---|
| Backend language/framework | NestJS (TypeScript) over plain Express — explicit module/controller/service/DI layering |
| Persistence | Real Postgres via Docker Compose, not an in-memory store |
| ORM | Prisma |
| Auth model | JWT (`@nestjs/jwt` + Passport), no session store |
| Purchase → student linking | Invitation-token model: checkout returns an invitation link rather than creating the student account directly |
| Multi-course support | Enrollment reuse — a second purchase for an already-activated student email links to the existing account instead of erroring or duplicating |
| Styling | Tailwind CSS |
| Test scope | Backend integration tests (Jest + Supertest) exercising the full purchase → onboarding → LMS-gating journey against a real database, no frontend test suite |
| Docker networking | nginx reverse-proxies `/api/*` to the backend so the browser only ever talks to one origin — no CORS config needed |
| Return-visit login | Separate `/login` route for students who already activated, on top of the invitation flow for first-time access |
| Onboarding form fields | Full name + password + confirm password, addressed to the specific course/email from the invitation |

Each of these came with Claude's recommended default and reasoning before the author confirmed it; see the "Key technical decisions" section of the root `README.md` for the rationale on each.

---

## Session 2 — Monorepo conversion

**Prompt:** "should we move this to a monorepo? analyze it and advise me. /grill-me"

Claude first analyzed the existing structure (two independent npm/pnpm projects, `backend/` and `frontend/`) and found exactly one concrete case of duplication: `frontend/src/lib/types.ts` hand-mirrored the backend's API response shapes. It recommended against a full monorepo restructure (no `apps/`/`packages/` rename, no Turborepo/Nx) and for a light pnpm workspace instead, reasoning that with two runtime services and one shared-types package, a build-graph tool would add ceremony without a real caching or task-orchestration problem to solve.

Key branch resolved: should the shared types package be a dependency of both frontend and backend, or frontend-only? Decision: **frontend-only**. The backend's Prisma models return `Date` objects that only become JSON strings after serialization over HTTP — if the backend imported the same interfaces as literal return-type annotations, the `createdAt: string` in the shared package would be a live lie about the backend's actual in-process types. The backend's real runtime response shapes stay the source of truth; the shared package documents the wire format for the one consumer (the frontend) that needs a static copy.

Outcome: `pnpm-workspace.yaml` + root `package.json`, `packages/contracts` (later renamed `packages/types` — see session 4) holding the response-shape interfaces, Docker build contexts moved from per-service to the repo root.

The user did not respond to one clarifying question within the interview's timeout window; per the skill's fallback instruction ("proceed using your best judgment"), Claude proceeded with its own recommended answer for that branch and flagged it in the summary.

---

## Session 3 — Prisma vs. Drizzle, and "why not just use Prisma's generated types"

**Prompt:** "couldn't this file's types `@packages/contracts/src/index.ts` be just the prisma schema generated types? tell me the pros and cons and the reasoning. there should be 1 source of truth imo. maybe drizzle is better here? pros and cons of drizzle instead of prisma. use context7 for all tools, for nestjs as well. which one is better of nest?"

This was advisory, not implementation — Claude read the actual backend service code before answering rather than reasoning abstractly, and used Context7 to pull current Prisma, Drizzle, and NestJS documentation rather than relying on training data.

**Finding 1 — reusing Prisma's generated types directly doesn't work cleanly:**
- `Course.createdAt` is `DateTime` in the Prisma schema → generated type is `Date`. The value only becomes a `string` after `JSON.stringify` over HTTP. Reusing Prisma's type would give the frontend a `Date`-typed field with no `Date` methods at runtime — worse than the explicit `string` already in `packages/contracts`.
- Only `Course` maps 1:1 to a Prisma model. `OrderResult`, `EnrollmentInfo`, `Dashboard`, `LessonSummary`, `LessonDetail` are hand-shaped/reshaped aggregates (confirmed by reading `orders.service.ts` and `lms.service.ts`) — there's no single Prisma type equal to most of them.
- The "correct at scale" fix for one source of truth is generating the shared types *from the backend's DTOs* (OpenAPI via `@nestjs/swagger`, or shared Zod schemas), not reusing Prisma's client types or switching ORMs. Judged as more machinery than a 3–4 hour exercise with 6 response shapes justifies.

**Finding 2 — Drizzle vs. Prisma, grounded in what actually happened in this repo:**
- Prisma's driver-adapter/codegen model (v7) caused real friction this session — `nodenext`-style `.js`-suffixed imports in the generated client broke `ts-node` and default Jest resolution, requiring `tsx` and a `moduleNameMapper` workaround, and the generated output has to stay gitignored (the exact cause of an earlier "why are dist/generated files in git" question).
- Drizzle's `$inferSelect`/`$inferInsert` gives types directly from the schema file with no codegen step — no generated-artifact class of bugs at all.
- Confirmed via Context7 against NestJS's own docs: Nest lists TypeORM, MikroORM, Sequelize, Knex, and Prisma as its documented database integrations, with an official Prisma recipe. Drizzle has no official Nest recipe — wiring it in is trivial (one custom provider) but off the paved road.

**Decision:** keep Prisma. The backend is built and tested; migrating ORMs now would be a full rewrite for a benefit (no generated directory) that's already been worked around, and Prisma remains the better Nest-ecosystem fit for this stack.

---

## Session 4 — Assignment audit + architecture doc

**Prompt:** pasted the full assignment brief, asked "do we accomplish every criteria?", asked for an HTML architecture/data-flow doc in `/docs`, and invoked `/grill-me`.

Claude treated the criteria audit as a factual check (not requiring an interview) and explored the repo directly rather than asking:
- Confirmed all functional requirements work end-to-end (re-verified live in a browser against a fresh `docker compose up --build`).
- Confirmed the tech stack matches the brief (React + Node.js/NestJS).
- **Found a real gap:** the finished application had never been pushed to a GitHub remote — the deliverable existed only locally.
- **Found a second gap:** the README's AI-usage section was prose describing that interviews happened, with no attached artifact — this file and `design.md` are the fix.

For the architecture doc itself, four genuine design branches were interviewed:

| Branch | Options considered | Decision |
|---|---|---|
| GitHub delivery | private+share with named reviewers / public / leave it, user pushes | **Public repo**, push `main` |
| AI-artifact gap | add a real discussion+design doc pair / leave prose-only | **Add `docs/ai-plan/discussion.md` + `design.md`** (this pair), styled after the `superpowers` plugin's brainstorming → design-doc convention |
| Diagram technology | Mermaid.js via CDN / hand-rolled HTML+CSS / inline SVG | **Hand-rolled HTML/CSS** boxes and arrows — fully offline, no CDN dependency, self-contained single file |
| Doc scope | component diagram only / + 3 flow sequence diagrams / + Prisma ER diagram | **All three**: component diagram, sequence diagrams for purchase/onboarding/LMS-access, and the Prisma ER diagram |
