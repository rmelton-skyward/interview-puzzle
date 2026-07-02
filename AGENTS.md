# AGENTS.md — Root

This file governs the whole repo. `backend/AGENTS.md` and `frontend/AGENTS.md` add
folder-specific rules and take precedence over this file *within their own folder*
if the two ever conflict. If you're an AI coding agent working in this repo, read
this file first, then the one in whichever folder you're editing.

## What this project is

A seat-selection system for a concert venue (take-home interview challenge).
Users pick a party size, the backend runs a best-seat algorithm (closest to
front-and-center, contiguous), the frontend highlights the result, and the user
books it. See `/docs/challenge-spec.md` (or the original prompt) for the full
algorithm spec and examples — don't re-derive requirements from memory, check it.

**`CHECKLIST.md` at the repo root tracks every base/mid/senior requirement as
checkboxes.** Update it as work is completed — it's the source of truth for
"is this project done," not this file.

## Project scope & requirement tier

- **Mid-level requirements are the floor for this project.** Every mid-level
  bullet in the challenge spec must be satisfied before anything else:
  backend error handling/validation, one additional endpoint, integration
  tests, API documentation, responsive design, booking confirmation flow with
  summary, basic accessibility, and data persistence across the session.
- **Senior-level requirements are opportunistic, not mandatory.** We are not
  attempting all of them. These are picked up naturally as part of doing the
  mid-level work properly, so we take them:
  - A simple relational schema (venues/seats/bookings) — cheap to get right
    even without an ORM.
  - Frontend state management architecture + written rationale — the RxJS
    store pattern itself *is* this deliverable.
  - One performance optimization: `@defer`-based lazy loading of the booking
    confirmation component (the concrete, easy-to-explain senior checkbox),
    with `OnPush` + `trackBy` applied throughout as good practice alongside it.
  - System design documentation (architecture diagram, data flow, deployment
    plan) — this is just writing it down, do it.
- Senior items being explicitly **skipped** unless there's spare time at the
  end: integration tests beyond what mid-level already requires, and anything
  under Bonus Points.
- If in doubt whether to spend time on a senior-tier polish item, default to
  "no" and make sure every mid-level item is airtight instead.

## Architecture at a glance

| Layer | Choice |
|---|---|
| Frontend | Angular (standalone components), hand-rolled RxJS store — **no NgRx** |
| Styling | Tailwind CSS |
| Frontend testing | Jest |
| Backend | NestJS, TypeScript |
| Database access | PostgreSQL via `pg` (node-postgres), parameterized queries — **no ORM** |
| Shared types | `@yourorg/shared-types` in `packages/`, consumed via npm's `file:` protocol — no registry, no publish step |
| Containerization | Docker Compose (`frontend`, `backend`, `postgres` services) |

## Repo structure

```
/
├── AGENTS.md                  ← you are here
├── CHECKLIST.md                 requirement tracking, see above
├── docker-compose.yml
├── docs/
│   └── challenge-spec.md        original prompt, copied in unmodified
├── packages/
│   └── shared-types/            source of the published package (see below)
│       ├── package.json
│       └── src/
│           ├── seat.ts
│           ├── venue.ts
│           └── booking.ts
├── backend/
│   ├── AGENTS.md
│   ├── package.json
│   ├── db/
│   │   └── migrations/          plain .sql files
│   ├── src/
│   └── test/
└── frontend/
    ├── AGENTS.md
    ├── package.json
    └── src/
```

## Shared types — the rules

- `packages/shared-types` is the **single source of truth** for any shape that
  crosses the frontend/backend boundary: `Seat`, `SeatStatus`, `Venue`,
  `BookingRequest`, `BookingResponse`, API error shapes, etc.
- It's structured as a real package — its own `package.json` with a name
  (`@yourorg/shared-types`) and version — but consumed via npm's **`file:`
  protocol** rather than a published registry package or a workspaces setup:

  ```
  // frontend/package.json and backend/package.json
  "dependencies": {
    "@yourorg/shared-types": "file:../packages/shared-types"
  }
  ```

  This is the easiest option that still behaves like a normal dependency:
  `npm install` resolves the local path directly (typically as a symlink),
  no registry, no auth, no publish step. Anyone cloning the repo runs
  `npm install` in each folder and it just works.
- `packages/shared-types` needs a tiny build step so there's a real `main`/
  `types` target to resolve, rather than pointing straight at `.ts` source:

  ```
  // packages/shared-types/package.json
  {
    "name": "@yourorg/shared-types",
    "version": "0.1.0",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "scripts": { "build": "tsc" }
  }
  ```

  Run `npm run build` in `packages/shared-types` whenever a type changes,
  before relying on it from either app. Since `file:` installs are usually
  symlinked, a fresh build is picked up immediately — no reinstall needed on
  the consuming side.
- Never redefine one of these interfaces locally in `frontend/` or `backend/`.
  If you need a variant (e.g. a DTO with extra validation decorators), it
  should `extend` or otherwise reference the shared type, not duplicate its
  fields.
- Anything purely internal to one side (a database row shape, an Angular
  component's local view-model) stays local. Shared types are for the wire
  format, not implementation detail.
- Import as `import type { Seat } from '@yourorg/shared-types'` — always use
  `import type` for type-only imports (see TypeScript rules below).
- If a Docker build ever fails to resolve `@yourorg/shared-types`, check that
  `packages/shared-types` is built (`dist/` exists) and copied into the
  image *before* `npm install` runs for `frontend`/`backend` in the
  Dockerfile — this is the one place the `file:` approach needs a little
  extra care compared to a registry package.

## TypeScript — non-negotiable

Both `frontend/tsconfig.json` and `backend/tsconfig.json` must have:

```
strict: true
noImplicitAny: true
noUncheckedIndexedAccess: true
exactOptionalPropertyTypes: true
```

- **No `any`.** If a type is genuinely unknown, use `unknown` and narrow it.
- **No non-null assertions (`!`)** as a substitute for actually checking.
  Exception: well-understood cases like a value just pushed into an array in
  the same expression — use judgment, but prefer a guard.
- **No `@ts-ignore` or `@ts-expect-error`** to silence a real type error. Fix
  the type. If you're truly stuck, leave a comment explaining why, and flag
  it out loud rather than suppressing silently.

## Security basics

- **No ORM does not mean no discipline.** All database access goes through
  parameterized queries — see `backend/AGENTS.md` for the specific rules.
  This is a hard requirement, not a suggestion.
- Never trust client input at the API boundary — validate with DTOs before
  it touches any query or business logic.

## Docker / running everything

- `docker-compose.yml` at the root brings up all three services with one
  command (`docker compose up`). Each of `frontend/` and `backend/` should
  also have its own `Dockerfile` (multi-stage: build stage + slim runtime
  stage).
- Postgres data should persist via a named volume, not an anonymous one, so
  `docker compose down` doesn't wipe bookings by accident.
- Environment variables (DB connection string, ports, API base URL) go
  through `.env` files with a checked-in `.env.example` — never commit real
  secrets.

## Testing philosophy

- Every change should come with tests at the level it touches: pure functions
  (the seat algorithm) get exhaustive unit tests; API endpoints get
  integration tests; RxJS stores get subscription-based tests; components get
  a small number of behavior-focused tests, not snapshot-everything.
- Prefer a **small number of focused, readable tests** over a large number of
  shallow ones. Test the algorithm against the exact examples in the
  challenge spec first, then edge cases.

## General conventions

- **Naming**: `camelCase` for variables/functions, `PascalCase` for
  classes/interfaces/components, `kebab-case` for file and folder names
  (`seat-map.component.ts`, not `seatMap.component.ts`).
- **Commits**: small, one logical change each. Conventional-commit-style
  prefixes (`feat:`, `fix:`, `test:`, `docs:`, `chore:`) are appreciated but
  not enforced by tooling here.
- **Don't introduce new major dependencies** (state libraries, alternate
  styling systems) without flagging it first — the stack above is
  intentional, not a starting suggestion.
- **Don't reach for NgRx, Redux, or any global state library.** The RxJS
  store pattern in `frontend/AGENTS.md` is deliberate and is itself something
  we want to be able to explain and defend in review.
- When something in the challenge spec is ambiguous, make a reasonable call,
  document the assumption in the relevant README, and move on — don't block
  on it.

## What "done" looks like for a change

Before considering a task complete, check:
1. Does it compile with `strict: true` and no suppressions?
2. Are there tests, and do they pass?
3. If it touches a shared type, was the version bumped and both sides updated?
4. Does `docker compose up` still bring the whole thing up cleanly?
5. Is it at least covering the relevant mid-level requirement(s) in full?
