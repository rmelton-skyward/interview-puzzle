# Seat Selection API — Backend

REST API for a concert venue seat-selection and booking system. The API validates venue layouts,
generates seats transactionally, recommends contiguous available seats, and creates explicit
bookings. It includes Docker support, CI checks, Swagger docs, rate limiting, and PostgreSQL
persistence.

## Approach

The seat-selection algorithm is implemented as a **pure, framework-free function**
(`src/algorithm/seatSelector.ts`) with no dependency on Express or Prisma, so it can be unit
tested in complete isolation. It is wrapped by a layered architecture:

```
HTTP request
  → routes (Express routers)        — HTTP contract and response codes
  → middleware + schemas            — cross-cutting concerns and Zod validation
  → services                        — business rules and transaction orchestration
  → algorithm                       — pure seat-selection logic (no I/O)
  → repositories (Prisma)           — data access
  → PostgreSQL
```

Each layer only depends on the one below it, so the algorithm, and each layer, can be tested
independently. See [Architecture](#architecture) below for the full rationale.

### Backend source map

```text
src/
  app.ts                 Express middleware and route registration; no listener
  server.ts              Runtime entry point that starts the HTTP listener
  config/                Validated environment settings loaded once at startup
  routes/                HTTP handlers and OpenAPI annotations
  schemas/               Zod request validation schemas
  middleware/            Validation, authorization, rate limiting, error handling
  services/              Use cases and business workflows
  algorithm/             Pure seat-selection rules
  repositories/          Prisma queries and persistence operations
  db/                    Prisma client initialization
  docs/                  OpenAPI configuration
  errors.ts              Typed application errors
prisma/
  schema.prisma          PostgreSQL data model
  migrations/            Versioned schema migrations
  seed.ts                Local sample data
tests/
  unit/                  Fast tests of isolated logic
  integration/           HTTP/service tests using PostgreSQL
```

Keep route handlers thin, put business decisions in services, and keep Prisma calls in
repositories. For a new capability, extend the relevant schemas, routes, services, repositories,
and tests as needed. Keep the pure algorithm independent of HTTP and persistence; introduce a
separate service or infrastructure only when there is a real deployment or scaling need.

`src/config/environment.ts` loads `.env`, parses the environment once, and applies defaults for
optional settings. It requires a valid PostgreSQL `DATABASE_URL` and validates `PORT` before the
server starts, so configuration errors identify the invalid setting early. The venue-list route
also goes through `venueService`, matching the other venue endpoints.

## Tech Stack

| Concern | Choice |
|---|---|
| Language / runtime | TypeScript, Node.js 20 |
| Framework | Express 5 |
| Validation | Zod |
| Database | PostgreSQL (via Docker) |
| ORM | Prisma |
| Testing | Vitest (unit + integration), Supertest |
| API docs | swagger-jsdoc + swagger-ui-express |
| Logging | pino / pino-http |
| Rate limiting | express-rate-limit |
| Build | `tsc` (no bundler needed for a Node backend) |

## Getting Started

### Prerequisites
- Node.js 20.19+ or 22.12+ (meets both backend and Vite requirements)
- Docker Desktop on Windows/macOS, or Docker Engine with the Compose plugin on Linux

### 1. Start PostgreSQL

From the **repo root**:

```bash
docker compose up -d postgres
```

> Note: the compose file maps Postgres to host port **5434** (not the default 5432), since 5432
> and 5433 were already in use by other local services during development. Adjust
> `docker-compose.yml` and `backend/.env` together if you need a different port.

### 2. Configure environment

Run the commands from the repository root:

macOS/Linux:
```bash
cd backend
if [ ! -f .env ]; then cp .env.example .env; fi
```

Windows PowerShell:
```powershell
Set-Location backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Windows Command Prompt:
```bat
cd backend
if not exist .env copy .env.example .env
```

Edit `backend/.env` if your local PostgreSQL port differs. `OPENAI_API_KEY` is optional for the
core booking app; set it there if you want to enable the AI seat assistant. Keep `.env` private and
do not commit it.

`backend/.env` is the development/demo profile and remains the default for `npm run dev`. When
`NODE_ENV=production` is set before starting Node, `src/config/environment.ts` loads
`backend/.env.production` instead. A secret-free starting template is provided as
[`backend/.env.production.example`](.env.production.example); copy it to `.env.production` only
when preparing a real production environment, replace every placeholder, and keep that file out of
Git. Production startup rejects a missing/short `ADMIN_TOKEN` or wildcard `CORS_ORIGIN`. Prefer
injecting these secrets through the deployment platform rather than storing them in a file.

### 3. Install dependencies and generate Prisma Client

Run these commands from `backend/` in any shell:
```bash
npm ci
npm run db:generate
```

`npm ci` installs both the Prisma CLI (`prisma`) and generated-client runtime (`@prisma/client`)
from the lockfile. `db:generate` creates the local Prisma Client from `prisma/schema.prisma`; no
global Prisma installation is needed.

### 4. Apply migrations and optionally seed sample venues

```bash
npm run db:migrate      # applies prisma/migrations to the local database
npm run db:seed         # clears app data, then seeds Main Hall (10x12) and Large Arena (10x50)
```

`db:seed` is destructive to application records: it deletes bookings, seats, and venues before
inserting its samples. Do not run it against data you need to keep. On API startup, a separate
initializer creates a 10x20 **Default Venue** only when the venue table is empty; it never clears
existing records.

### 5. Run the API

```bash
npm run dev             # http://localhost:4000, auto-restarts on change
```

- Health check: `GET http://localhost:4000/api/health`
- Interactive API docs: `http://localhost:4000/docs`

### Run PostgreSQL and the API in Docker

```bash
docker compose up --build
```

Compose starts PostgreSQL, the API, and the Nginx-hosted frontend. It waits for PostgreSQL's
healthcheck, generates Prisma Client during the backend image build, applies migrations in the
backend container entrypoint, and waits for the API healthcheck before starting the frontend.
Compose defaults the API to the development profile for local demos; it does not mount
`backend/.env.production`. Production deployments should provide validated environment values and
secrets through the deployment platform.
Open `http://localhost:5173`; Nginx proxies `/api/` and `/docs` to the API. The API is also
available directly at `http://localhost:4000`. The default host ports are PostgreSQL `5434`, API
`4000`, and frontend `5173`; see [frontend/README.md](../frontend/README.md) for port overrides.
On first startup with an empty database, the API creates a **Default Venue** with 10 rows and 20
columns. It does not add sample venues when any venue already exists. To enable AI in Docker, set
`OPENAI_API_KEY` in the repo-root `.env` before starting Compose; that file is ignored by Git.
Stop the stack with `docker compose down`.

## Running Tests

```bash
npm test          # unit + integration tests (requires Postgres running, see above)
npm run test:watch
npm run lint
npm run typecheck
```

- **Unit tests** (`tests/unit/`) — the seat-selection algorithm in isolation, with worked examples
  and edge cases (no available seats, party size larger than any run, gaps splitting a row, and
  fallback to a farther row).
- **Integration tests** (`tests/integration/`) — services and HTTP endpoints against PostgreSQL.
  The API tests create and clean up their own test venue; they also submit two simultaneous booking
  requests for the same seat and verify that exactly one succeeds.

## API Overview

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Service + DB connectivity check |
| GET | `/api/venues` | List venue summaries |
| POST | `/api/venues` | Create a venue and generate its seats |
| GET | `/api/venues/:id` | Venue layout + full seat map |
| DELETE | `/api/venues/:id` | Delete a venue and cascade its seats/bookings |
| POST | `/api/venues/:id/best-seats` | Read-only: best contiguous seats for a party size |
| POST | `/api/venues/:id/seat-assistant` | Parse a natural-language seat request with AI, then use the deterministic selector |
| POST | `/api/bookings` | Book a specific set of seats |
| GET | `/api/bookings/:id` | Retrieve a booking and its seats |

Full request/response schemas: `/docs` (Swagger UI) once the server is running.

Venue creation and deletion accept the optional `ADMIN_TOKEN` environment variable. When it is
configured, send the token using `x-admin-token` or `Authorization: Bearer <token>`. The routes
remain open in local development when `ADMIN_TOKEN` is unset.

The seat assistant requires `OPENAI_API_KEY` and uses `OPENAI_MODEL` (default `gpt-4o-mini`). The
model only extracts structured preferences; the existing seat-selection algorithm remains the
source of truth and booking still requires a separate explicit request.

Venue creation accepts a non-empty name up to 30 characters, with case-insensitive duplicate names
rejected as `409 Conflict`. Layouts allow 1–50 rows and 1–1,000 columns (up to 50,000 seats). These
limits are enforced by the Zod request schema and frontend form.

## Architecture

```mermaid
flowchart LR
    subgraph Backend [Express API - layered]
        Routes["Routes / Controllers"] --> Services["Services\n(business rules)"]
        Services --> Algorithm["Algorithm\n(pure function)"]
        Services --> Repo["Repositories\n(Prisma)"]
        Repo --> DB[(PostgreSQL)]
    end
    Client[Frontend / API client] -- REST/JSON --> Routes
```

**Why a layered modular monolith instead of microservices:** the problem domain (one booking
flow) doesn't warrant the operational overhead of separate services. A layered structure gives
the same testability and separation-of-concerns benefits with far less complexity.

**Why the algorithm is a pure function:** it has zero dependencies on Express or the database, so
its 3 documented worked examples (and edge cases) can be verified with millisecond-fast unit
tests with no test database required.

**Why booking runs inside a Prisma `$transaction`:** the service checks venue and seat ownership,
then conditionally updates only seats still marked `AVAILABLE`. It verifies the affected-row count
before creating the booking record. A competing request that waits for those rows to be updated
will observe a smaller count and receive `409 Conflict`; the transaction rolls back any partial
claim. An integration test races two API requests for the same seat and verifies exactly one
booking succeeds.

### Frontend Components and State

The React frontend is documented in [frontend/README.md](../frontend/README.md). `frontend/src/App.tsx`
owns shared page state and API workflows; reusable page sections live in `frontend/src/Components/`:
`Header`, `ManageVenue`, `VenueControls`, `FindBestSeats`, `AskAI`, `VenueFloorSeating`, and
`BookSeats`. Shared state is passed through props using React's built-in hooks rather than a global
state store. `ManageVenue` keeps its temporary form inputs locally.

## Database Schema

```mermaid
erDiagram
    VENUE ||--o{ SEAT : has
    VENUE ||--o{ BOOKING : has
    BOOKING ||--o{ BOOKING_SEAT : includes
    SEAT ||--o| BOOKING_SEAT : "booked via"

    VENUE {
        string id PK
        string name
        int rows
        int columns
    }
    SEAT {
        string id PK
        string venueId FK
        string row
        int column
        enum status
    }
    BOOKING {
        string id PK
        string venueId FK
        int partySize
        enum status
    }
    BOOKING_SEAT {
        string bookingId FK
        string seatId FK
    }
```

`Seat` has a unique constraint on `(venueId, row, column)` and an index on `(venueId, status)` to
keep the common "list available seats for a venue" query fast as venue size grows.

## Handling Ambiguity — Assumptions

The challenge explicitly asks for documented assumptions where the spec is ambiguous:

1. **No solution behavior**: if no row has a contiguous block large enough for the requested
   party size, `/best-seats` returns `404 NO_SEATS_AVAILABLE` rather than an empty array — this
   was chosen to make "no valid seats" unambiguous to API consumers (vs. an empty 200 response,
   which could be mistaken for "zero seats requested").
2. **Best-seats is read-only**: `/best-seats` never mutates seat status. Only `POST /bookings`
   commits a reservation. This matches the documented user flow ("seats highlight as best
   available" → separate "Book These Seats" action).
3. **Row-dominance edge case**: if the closest row *cannot* fit the party contiguously (e.g. its
   free seats are fragmented by existing bookings), the algorithm falls through to the next row,
   rather than failing outright — "closer row always preferred" is interpreted as applying only
   among rows that can actually fit the group.
4. **Multi-letter rows**: row labels use spreadsheet-style names (`a`–`z`, then `aa`, `ab`, ...).
  The API allows up to 50 rows, so multi-letter labels are used for rows 27–50.
5. **Seat status values**: `AVAILABLE`, `RESERVED`, `BOOKED` are treated as the full status enum;
   only `AVAILABLE` seats are eligible for `/best-seats` or booking.

## Performance & Scalability

**Current algorithm**: O(rows × columns) worst case — for every row, seats are read once and
scanned once for contiguous runs. A 50,000-seat venue therefore means up to 50,000 seat checks
for a recommendation. Actual latency depends on database I/O, runtime, and deployment hardware
and should be measured with representative data before setting a performance target.

**What would change for 50,000+ seats in production:**

- **Avoid loading the full seat map per request.** Today, `getBestSeats` loads every seat for a
  venue on every call. At large scale, this should be replaced with a query that only pulls
  `AVAILABLE` seats per row (`WHERE venueId = ? AND status = 'AVAILABLE'`, using the existing
  `(venueId, status)` index), and can stop early once a valid contiguous block is found in the
  frontmost row — avoiding a full table scan for every request.
- **Cache venue layout.** `rows`/`columns` almost never change; only seat status does. Layout
  could be cached (in-memory or Redis) separately from live seat status.
- **Avoid sending the entire seat map to the frontend.** `GET /venues/:id` should support
  pagination or viewport-based fetching (e.g. only rows currently visible) instead of returning
  all seats at once.
- **Concurrency at scale**: the conditional update protects the booking transition without an
  explicit `SELECT FOR UPDATE`. At very high volume for popular seats, short-lived holds or a queue
  may help manage contention; add distributed coordination only when measured load warrants it.
| Concurrent booking handling (bonus) | ✅ Conditional availability update and concurrent API integration test |
- **Horizontal scaling**: the API itself is stateless and can run multiple instances behind a
  load balancer; Postgres would need read replicas for the read-heavy `/venues/:id` and
  `/best-seats` paths if traffic grew significantly.

## Deployment Plan

- **Backend**: containerized via the provided `Dockerfile`; deployable as-is to Fly.io, Render,
  or Railway free tiers (all support arbitrary Docker images and injected env vars for
  `DATABASE_URL`, `CORS_ORIGIN`, `OPENAI_API_KEY`).
- **Database**: a managed free-tier Postgres (Neon, Supabase, or the target platform's own
  managed Postgres add-on) in production, instead of the local Docker container used for
  development.
- **CI**: the existing GitHub Actions workflow (`.github/workflows/ci.yml`) runs backend
  lint/typecheck/tests/build for pull requests and pushes to `main` that touch backend files or
  the workflow. It does not build or deploy the frontend, and it has no deployment job. A future
  deployment workflow could build and push the Docker image, then trigger a deploy on the chosen
  platform.
- **Migrations in production**: the Docker entrypoint runs `prisma migrate deploy` automatically
  on container start, so schema changes ship atomically with each deploy.

## Implementation Checklist

| Requirement | Status |
|---|---|
| Core seat selection algorithm | ✅ `src/algorithm/seatSelector.ts` |
| REST endpoint(s) for best seats + venue status | ✅ |
| Automated tests (algorithm) | ✅ unit tests for examples and edge cases |
| README: approach, run, test instructions | ✅ (this file) |
| Error handling & validation (Mid) | ✅ Zod + typed `AppError` hierarchy |
| Additional endpoint — booking (Mid) | ✅ `POST /api/bookings` |
| Integration/API tests (Mid) | ✅ service and API integration tests |
| API documentation (Mid) | ✅ Swagger UI at `/docs` |
| DB schema with relationships (Senior) | ✅ Prisma schema, see [above](#database-schema) |
| Architectural documentation (Senior) | ✅ see [Architecture](#architecture) |
| Performance/scalability discussion (Senior) | ✅ see [above](#performance--scalability) |
| Observability (bonus) | ✅ pino structured logging |
| Concurrent booking handling (bonus) | ✅ Conditional availability update and concurrent API integration test |
| Dockerization (bonus) | ✅ multi-stage `Dockerfile` + compose |
| CI pipeline (bonus) | ✅ Backend quality checks in GitHub Actions; no automated deployment |
| API documentation UI (bonus) | ✅ Swagger UI |
| Rate limiting (bonus) | ✅ `express-rate-limit` |
| Database implementation (bonus) | ✅ fully implemented, not just schema |
| Deployment (bonus) | ✅ documented plan (not deployed live) |
| AI integration (bonus) | ✅ natural-language seat assistant with validated output and mocked tests |
